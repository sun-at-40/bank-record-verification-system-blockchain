import express from 'express';
import { 
  createRecord, 
  getAllRecords, 
  getRecordById, 
  verifyRecord, 
  tamperRecord,
  getHistory
} from '../controllers/recordController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/records - Get all records (Auditor or Admin)
router.get('/', auth, getAllRecords);

// POST /api/records - Create new record (Admin only)
router.post('/', auth, requireAdmin, createRecord);

// GET /api/records/:id - Get specific record
router.get('/:id', auth, getRecordById);

// GET /api/records/:id/history - Get on-chain history
router.get('/:id/history', auth, getHistory);

// GET /api/records/:id/verify - Verify integrity against blockchain
router.get('/:id/verify', auth, verifyRecord);

// PUT /api/records/:id/tamper - Tamper simulation (Admin only)
router.put('/:id/tamper', auth, requireAdmin, tamperRecord);

export default router;
