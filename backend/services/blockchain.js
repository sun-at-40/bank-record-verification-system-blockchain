import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read ABI locally to support Docker containerization
const artifactPath = path.resolve(__dirname, '../abi.json');
const contractABI = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

export const anchorRecordHash = async (recordId, hash) => {
  try {
    const tx = await contract.addRecord(recordId, hash);
    const receipt = await tx.wait();
    return receipt.hash; // transaction hash
  } catch (error) {
    console.error('Error anchoring record hash:', error);
    throw error;
  }
};

export const verifyRecordHash = async (recordId, hashToCheck) => {
  try {
    const isValid = await contract.verifyRecord(recordId, hashToCheck);
    return isValid;
  } catch (error) {
    console.error('Error verifying record hash:', error);
    throw error;
  }
};

export const getRecordHistory = async (recordId) => {
  try {
    const history = await contract.getRecordHistory(recordId);
    return history.map(entry => ({
      recordHash: entry.recordHash,
      timestamp: Number(entry.timestamp),
      submittedBy: entry.submittedBy
    }));
  } catch (error) {
    console.error('Error fetching record history:', error);
    throw error;
  }
};
