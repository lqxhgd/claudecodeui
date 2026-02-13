import express from 'express';
import bcrypt from 'bcrypt';
import { userDb, db } from '../database/db.js';
import { generateToken, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Check auth status and setup requirements
router.get('/status', async (req, res) => {
  try {
    const hasUsers = await userDb.hasUsers();
    res.json({
      needsSetup: !hasUsers,
      isAuthenticated: false // Will be overridden by frontend if token exists
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration (self-registration)
// - If no users exist yet, anyone can register (first user becomes admin)
// - If users exist, registration is only allowed when ALLOW_SELF_REGISTRATION=true
// - Otherwise, only admins can create users via POST /api/auth/invite
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username must be at least 3 characters, password at least 6 characters' });
    }

    // Use a transaction to prevent race conditions
    db.prepare('BEGIN').run();
    try {
      const hasUsers = userDb.hasUsers();

      // If users already exist, check if self-registration is allowed
      if (hasUsers && process.env.ALLOW_SELF_REGISTRATION !== 'true') {
        db.prepare('ROLLBACK').run();
        return res.status(403).json({ error: 'Self-registration is disabled. Contact an admin for an invite.' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user (first user auto-assigned admin by db layer)
      const user = userDb.createUser(username, passwordHash);

      // Generate token
      const token = generateToken(user);

      // Update last login
      userDb.updateLastLogin(user.id);

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        token
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user from database
    const user = userDb.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    userDb.updateLastLogin(user.id);

    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
router.get('/user', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// Logout (client-side token removal, but this endpoint can be used for logging)
router.post('/logout', authenticateToken, (req, res) => {
  // In a simple JWT system, logout is mainly client-side
  // This endpoint exists for consistency and potential future logging
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================================
// Admin-only endpoints
// ============================================================

// List all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = userDb.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin creates a new user (invite)
router.post('/invite', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username must be at least 3 characters, password at least 6 characters' });
    }

    // Validate role if provided
    const validRoles = ['admin', 'user'];
    const assignedRole = role && validRoles.includes(role) ? role : 'user';

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with specified role
    const user = userDb.createUser(username, passwordHash, assignedRole);

    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (error) {
    console.error('Invite user error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Admin deactivates a user (soft delete)
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent admin from deactivating themselves
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const success = userDb.deactivateUser(targetUserId);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin changes user role
router.put('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate role
    const validRoles = ['admin', 'user'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user".' });
    }

    // Prevent admin from demoting themselves
    if (targetUserId === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const success = userDb.updateUserRole(targetUserId, role);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
