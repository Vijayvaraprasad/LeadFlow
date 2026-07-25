import { authService } from '../services/auth.service.js';

export const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
