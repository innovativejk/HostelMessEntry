// backend/controllers/admin/user.controller.js
import { validationResult } from 'express-validator';
import userService from '../../services/admin/user.service.js';

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation Errors:', errors.array()); // Keep this for debugging 400 errors
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error in getUserById:', error);
    next(error);
  }
};

export const createUser = [
  async (req, res, next) => {
    try {
      const userId = await userService.createUser(req.body);
      res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
      console.error('Error in createUser:', error);
      if (error.message.includes('Email already registered')) {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }
];

export const updateUser = [
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await userService.updateUser(parseInt(id), req.body);
      if (!updated) {
        return res.status(404).json({ message: 'User not found or no changes made' });
      }
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error in updateUser:', error);
      if (error.message.includes('Email already taken')) {
        return res.status(409).json({ message: error.message });
      }
      // Log the validation errors specifically if the middleware passes them through
      if (error.errors) { // Check if the error object has an 'errors' array from express-validator
          console.error('Validation errors caught by controller:', error.errors);
          return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
];

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await userService.deleteUser(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    next(error);
  }
};