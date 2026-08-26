import mongoose from 'mongoose';

const bankRecordSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  recordData: {
    type: String, // Can store JSON string of full record details for hashing
    required: true
  },
  onChainHash: {
    type: String, // The SHA-256 hash stored on blockchain
    required: true
  },
  transactionHash: {
    type: String, // The blockchain transaction hash that anchored it
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'tampered'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('BankRecord', bankRecordSchema);
