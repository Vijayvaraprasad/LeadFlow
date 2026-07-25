import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  getLeads, 
  getLeadById, 
  captureLead, 
  updateLead, 
  deleteLead, 
  addNote, 
  getActivity, 
  getStats 
} from '../controllers/lead.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateCapture, validateNote } from '../middleware/validate.js';

const router = Router();

const captureLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/capture', captureLimiter, validateCapture, captureLead);

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', authorize('admin'), deleteLead);
router.post('/:id/notes', validateNote, addNote);
router.get('/:id/activity', getActivity);

export default router;
