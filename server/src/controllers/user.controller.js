import { userService } from '../services/user.service.js';

export const getUsers = (req, res, next) => {
  try {
    const users = userService.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = (req, res, next) => {
  try {
    const user = userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};
