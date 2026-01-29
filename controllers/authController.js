const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const crypto = require('crypto');

/**
 * Authentication Controller
 * Handles user authentication operations
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register new employee (public self-registration)
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const {
      matricule,
      firstname,
      lastname,
      email,
      password,
      phone,
      position,
      department,
      address,
      city,
      postalCode,
      latitude,
      longitude
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Variables pour les infos du matricule
    let matriculeData = null;
    let finalFirstname = firstname;
    let finalLastname = lastname;
    let finalPosition = position;
    let finalDepartment = department;

    // Si un matricule est fourni, vérifier et récupérer les infos
    if (matricule) {
      const EmployeeMatricule = require('../models/EmployeeMatricule');

      const matriculeDoc = await EmployeeMatricule.findOne({
        matricule: matricule.toUpperCase()
      });

      if (!matriculeDoc) {
        return res.status(400).json({
          status: 'error',
          message: 'Matricule introuvable'
        });
      }

      if (matriculeDoc.isUsed) {
        return res.status(400).json({
          status: 'error',
          message: 'Ce matricule est déjà utilisé'
        });
      }

      // Utiliser les infos du matricule
      finalFirstname = matriculeDoc.prenom;
      finalLastname = matriculeDoc.nom;
      finalPosition = matriculeDoc.poste;
      finalDepartment = matriculeDoc.department;

      matriculeData = matriculeDoc;
    }

    // Create new user with active status (direct access without manager validation)
    const user = new User({
      firstname: finalFirstname,
      lastname: finalLastname,
      matricule: matricule ? matricule.toUpperCase() : undefined,
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'employee',
      status: 'pending',
      active: false,
      phone,
      position: finalPosition,
      department: finalDepartment,
      address,
      city,
      postalCode,
      latitude,
      longitude
    });

    await user.save();

    // Si matricule utilisé, marquer comme utilisé
    if (matriculeData) {
      await matriculeData.markAsUsed(user._id);
    }

    // Auto-add user to their department group
    if (finalDepartment) {
      const { addUserToDepartmentGroup } = require('../utils/initDepartmentGroups');
      await addUserToDepartmentGroup(user._id, finalDepartment);
    }

    // Remove password from response
    user.passwordHash = undefined;

    // Generate JWT token for immediate login
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. You can now login.',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user status is active
    if (user.status === 'pending') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is pending approval. Please wait for manager validation.'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        status: 'error',
        message: 'Account registration was rejected. Please contact HR.'
      });
    }

    // Check if user is active
    if (!user.active || user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.passwordHash = undefined;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(req.user._id, { fcmToken });

    res.status(200).json({
      status: 'success',
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/create-manager
 * @desc    Create a manager user (temporary for testing)
 * @access  Public (should be removed in production)
 */
exports.createManager = async (req, res, next) => {
  try {
    // Check if manager already exists
    const existingManager = await User.findOne({ email: 'manager@draxlmaier.com' });
    if (existingManager) {
      return res.status(200).json({
        status: 'success',
        message: 'Manager already exists',
        credentials: {
          email: 'manager@draxlmaier.com',
          password: 'Manager123',
          role: 'manager'
        }
      });
    }

    // Create manager user
    const manager = new User({
      firstname: 'Manager',
      lastname: 'Test',
      email: 'manager@draxlmaier.com',
      passwordHash: 'Manager123',
      role: 'manager',
      status: 'active',
      active: true,
      phone: '+33612345678',
      position: 'Chef de département',
      department: 'Direction',
      employeeId: 'MGR001'
    });

    await manager.save();

    res.status(201).json({
      status: 'success',
      message: 'Manager created successfully',
      credentials: {
        email: 'manager@draxlmaier.com',
        password: 'Manager123',
        role: 'manager'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Google Sign In / Sign Up
 * @access  Public
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { email, displayName, photoUrl } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required for Google authentication'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, log them in
      const token = generateToken(user._id);

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          status: user.status
        }
      });
    }

    // User doesn't exist, create new account
    const names = displayName ? displayName.split(' ') : ['Google', 'User'];
    const firstname = names[0] || 'Google';
    const lastname = names.slice(1).join(' ') || 'User';

    user = new User({
      firstname,
      lastname,
      email: email.toLowerCase(),
      passwordHash: Math.random().toString(36).substring(7), // Random password for Google users
      role: 'employee',
      status: 'active',
      active: true
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully with Google',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create test employee (Development only)
 * POST /api/auth/create-employee
 */
exports.createEmployee = async (req, res, next) => {
  try {
    // Check if employee already exists
    const existingEmployee = await User.findOne({ email: 'jean.dupont@draxlmaier.com' });

    if (existingEmployee) {
      return res.status(200).json({
        status: 'success',
        message: 'Test employee already exists',
        credentials: {
          email: 'jean.dupont@draxlmaier.com',
          password: 'Employee123'
        },
        user: existingEmployee
      });
    }

    // Create employee
    const employee = await User.create({
      firstname: 'Jean',
      lastname: 'Dupont',
      email: 'jean.dupont@draxlmaier.com',
      password: 'Employee123',
      role: 'employee',
      employeeId: 'EMP001',
      department: 'Production',
      position: 'Technicien',
      active: true,
      status: 'active'
    });

    res.status(201).json({
      status: 'success',
      message: 'Test employee created successfully',
      credentials: {
        email: 'jean.dupont@draxlmaier.com',
        password: 'Employee123'
      },
      user: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgotpassword
 * @desc    Forgot Password - Send reset token via email
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email'
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save to DB
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 10 minutes
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // In a real app, send email here. For PFE demo, we return the token directly.
    console.log(`🔑 DEMO MODE - Reset Token for ${user.email}: ${resetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'Email sent (Simulation: Check Server Logs for Token)',
      resetToken: resetToken // Only for development/demo purposes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/resetpassword/:resetToken
 * @desc    Reset Password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Hash token to compare with DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); // Will trigger pre-save hook for hashing

    // Generate new JWT
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
      token
    });
  } catch (error) {
    next(error);
  }
};
