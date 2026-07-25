import { Router } from 'express';
import { getUsers, createUser } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateUser } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getUsers);
router.post('/', validateUser, createUser);

export default router;
