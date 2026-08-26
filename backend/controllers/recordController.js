import crypto from 'crypto';
import BankRecord from '../models/BankRecord.js';
import { anchorRecordHash, verifyRecordHash, getRecordHistory } from '../services/blockchain.js';
import mongoose from "mongoose";

// Helper to compute SHA-256 hash
const computeHash = (dataString) => {
  return '0x' + crypto.createHash('sha256').update(dataString).digest('hex');
};

const computeRecordHash = (record) => {
  const storedData = JSON.parse(record.recordData);
  const currentData = {
    customerName: record.customerName,
    accountNumber: record.accountNumber,
    balance: record.balance,
    recordDetails: storedData.recordDetails
  };

  return computeHash(JSON.stringify(currentData));
};

function buildRecordQuery(id) {
  const or = [{ recordId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    or.push({ _id: id });
  }
  return { $or: or };
}

export const createRecord = async (req, res) => {
  try {
    const { customerName, accountNumber, balance, recordDetails } = req.body;

    // The data we actually store in DB as a string to maintain exact reproducibility for hashing
    const recordDataObj = { customerName, accountNumber, balance, recordDetails };
    const recordDataString = JSON.stringify(recordDataObj);

    // 1. Compute Hash
    const recordHash = computeHash(recordDataString);

    // 2. We need a unique ID for the DB and Blockchain. We'll create a temporary mongo ID
    const newRecord = new BankRecord({
      customerName,
      accountNumber,
      balance,
      recordData: recordDataString,
      onChainHash: recordHash,
      transactionHash: 'pending' // will update after tx
    });
    
    // We use the mongo _id as the unique string ID for the blockchain
    const recordId = newRecord._id.toString();

    // 3. Anchor to Blockchain
    try {
      const txHash = await anchorRecordHash(recordId, recordHash);
      
      // 4. Update DB with successful tx hash
      newRecord.transactionHash = txHash;
      newRecord.status = 'verified';
      await newRecord.save();

      res.status(201).json({ message: 'Record created and anchored to blockchain', record: newRecord });
    } catch (blockchainError) {
      console.error('Blockchain anchoring failed:', blockchainError);
      return res.status(500).json({ message: 'Failed to anchor to blockchain', error: blockchainError.message });
    }

  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllRecords = async (req, res) => {
  try {
    const records = await BankRecord.find().sort({ createdAt: -1 });

    // Refresh each displayed status from the current database data and on-chain hash.
    await Promise.all(records.map(async (record) => {
      try {
        const currentHash = computeRecordHash(record);
        const isAuthentic = await verifyRecordHash(record._id.toString(), currentHash);
        const status = isAuthentic ? 'verified' : 'tampered';

        if (record.status !== status) {
          record.status = status;
          await record.save();
        }
      } catch (verificationError) {
        // A reset or changed blockchain has no history for older DB records.
        if (record.status !== 'pending') {
          record.status = 'pending';
          await record.save();
        }
      }
    }));

    res.json(records);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getRecordById = async (req, res) => {
  const { id } = req.params;
  const record = await BankRecord.findOne(buildRecordQuery(id));
  if (!record) return res.status(404).json({ message: "Record not found" });
  return res.json(record);
};

export const auditRecord = async (req, res) => {
  const { id } = req.params;
  const record = await BankRecord.findOne(buildRecordQuery(id));
  if (!record) return res.status(404).json({ message: "Record not found" });

  // IMPORTANT: recompute hash from current DB fields, do not trust stored record.hash
  // ...existing audit compare logic...
};
// export const getRecordById = async (req, res) => {
//   try {
//     const record = await BankRecord.findById(req.params.id);
//     if (!record) return res.status(404).json({ message: 'Record not found' });
//     res.json(record);
//   } catch (error) {
//     console.error('Get record error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const getHistory = async (req, res) => {
  try {
    const history = await getRecordHistory(req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const record = await BankRecord.findById(recordId);
    
    if (!record) return res.status(404).json({ message: 'Record not found in database' });

    // Recompute hash from CURRENT database fields
    const currentHash = computeRecordHash(record);

    // Call blockchain to verify
    const isValidOnChain = await verifyRecordHash(recordId, currentHash);

    // Update DB status if it changed
    const newStatus = isValidOnChain ? 'verified' : 'tampered';
    if (record.status !== newStatus) {
      record.status = newStatus;
      await record.save();
    }

    res.json({ 
      isAuthentic: isValidOnChain, 
      currentHash,
      onChainHash: record.onChainHash,
      status: newStatus
    });

  } catch (error) {
    console.error('Verify record error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// DEMO ENDPOINT: Tamper with a record directly in the DB
export const tamperRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const record = await BankRecord.findById(recordId);
    
    if (!record) return res.status(404).json({ message: 'Record not found' });

    // We maliciously alter the record data in the database WITHOUT updating the blockchain
    const originalData = JSON.parse(record.recordData);
    originalData.balance = 999999999; // Tampered balance!
    
    record.recordData = JSON.stringify(originalData);
    record.balance = 999999999;
    // Note: We deliberately DO NOT recompute the onChainHash or call the smart contract here!
    
    await record.save();

    res.json({ message: 'Record maliciously tampered in database!', tamperedRecord: record });
  } catch (error) {
    console.error('Tamper record error:', error);
    res.status(500).json({ message: 'Server error during tampering' });
  }
};
