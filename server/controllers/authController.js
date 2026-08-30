const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const { generateToken } = require('../utils/tokenHelper');
const ApiResponse = require('../utils/apiResponse');

/**
 * Register a new user (Student or Institution)
 * Admin accounts cannot be created via public registration
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = ROLES.STUDENT,
      studentId,
      institutionName,
      institutionCode,
    } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return ApiResponse.error(res, 'Name, email, and password are required.', 400);
    }

    if (password.length < 6) {
      return ApiResponse.error(res, 'Password must be at least 6 characters long.', 400);
    }

    // 2. Prevent unauthorized admin creation
    if (role === ROLES.ADMIN) {
      return ApiResponse.error(
        res,
        'Administrative accounts cannot be registered publicly.',
        403
      );
    }

    if (![ROLES.STUDENT, ROLES.INSTITUTION].includes(role)) {
      return ApiResponse.error(
        res,
        `Invalid role specified. Supported registration roles: '${ROLES.STUDENT}', '${ROLES.INSTITUTION}'.`,
        400
      );
    }

    // 3. Check for existing user with identical email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return ApiResponse.error(
        res,
        'An account with this email address already exists. Please log in.',
        409
      );
    }

    let resolvedInstitutionId = null;
    let resolvedInstitutionCode = null;
    let resolvedInstitutionName = null;

    // 4. Role-specific onboarding logic
    if (role === ROLES.INSTITUTION) {
      if (!institutionName || !institutionCode) {
        return ApiResponse.error(
          res,
          'Institution name and institution code are required for university registrations.',
          400
        );
      }

      // Check if institution record already exists or create new
      let institution = await Institution.findOne({
        code: institutionCode.toUpperCase().trim(),
      });

      if (!institution) {
        institution = await Institution.create({
          name: institutionName.trim(),
          code: institutionCode.toUpperCase().trim(),
          contactEmail: email.toLowerCase().trim(),
          verificationStatus: 'VERIFIED', // Default verified for development
        });
      }

      resolvedInstitutionId = institution._id;
      resolvedInstitutionCode = institution.code;
      resolvedInstitutionName = institution.name;
    }

    // 5. Create new User
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // Mongoose pre-save hook hashes this with bcrypt
      role,
      studentId: role === ROLES.STUDENT ? (studentId || `ABC-${Date.now().toString().slice(-6)}`) : null,
      institutionId: resolvedInstitutionId,
      institutionCode: resolvedInstitutionCode,
      institutionName: resolvedInstitutionName,
      isActive: true,
    });

    // 6. Generate JWT token
    const token = generateToken(newUser);

    return ApiResponse.created(
      res,
      {
        user: newUser,
        token,
      },
      `Successfully registered as ${role.toUpperCase()}. Welcome to NEP Academic Credit Hub.`
    );
  } catch (error) {
    console.error('Registration Error:', error);
    return ApiResponse.error(res, error.message || 'Registration failed.', 500);
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return ApiResponse.error(res, 'Email and password are required.', 400);
    }

    // Find user by lowercase email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return ApiResponse.error(res, 'Invalid credentials. User not found.', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(
        res,
        'Account has been deactivated. Please contact support.',
        403
      );
    }

    // Compare bcrypt password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials. Incorrect password.', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    return ApiResponse.success(
      res,
      {
        user,
        token,
      },
      `Welcome back, ${user.name}! Login successful.`
    );
  } catch (error) {
    console.error('Login Error:', error);
    return ApiResponse.error(res, error.message || 'Login failed.', 500);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return ApiResponse.success(
      res,
      {
        user: req.user,
      },
      'User profile retrieved successfully'
    );
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch user profile', 500);
  }
};

/**
 * Internal Admin Bootstrapper
 * Ensures a default system administrator exists in development/demo environments
 */
const ensureAdminAccount = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nep.gov.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
    if (!existingAdmin) {
      await User.create({
        name: 'National Credit Hub Administrator',
        email: adminEmail.toLowerCase().trim(),
        passwordHash: adminPassword,
        role: ROLES.ADMIN,
        isActive: true,
      });
      console.log(`🔑 Default Admin initialized: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to initialize admin account:', err.message);
  }
};

module.exports = {
  register,
  login,
  getMe,
  ensureAdminAccount,
};
