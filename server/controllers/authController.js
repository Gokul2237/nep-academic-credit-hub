const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const { generateToken } = require('../utils/tokenHelper');
const ApiResponse = require('../utils/apiResponse');

/**
 * Register a new user
 *
 * Student:
 * - Must select an existing verified institution
 * - institutionId is stored in the User document
 *
 * Institution:
 * - Can create an institution account
 * - Institution record is created automatically if it does not exist
 *
 * Admin:
 * - Cannot be created through public registration
 *
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
      institutionId,
      institutionName,
      institutionCode,
    } = req.body;

    // ============================================================
    // 1. BASIC VALIDATION
    // ============================================================

    if (!name || !email || !password) {
      return ApiResponse.error(
        res,
        'Name, email, and password are required.',
        400
      );
    }

    if (password.length < 6) {
      return ApiResponse.error(
        res,
        'Password must be at least 6 characters long.',
        400
      );
    }

    // ============================================================
    // 2. NORMALIZE ROLE
    // ============================================================

    const normalizedRole = String(role).toLowerCase().trim();

    // ============================================================
    // 3. PREVENT ADMIN REGISTRATION
    // ============================================================

    if (normalizedRole === ROLES.ADMIN) {
      return ApiResponse.error(
        res,
        'Administrative accounts cannot be registered publicly.',
        403
      );
    }

    // ============================================================
    // 4. VALIDATE ROLE
    // ============================================================

    if (
      ![ROLES.STUDENT, ROLES.INSTITUTION].includes(normalizedRole)
    ) {
      return ApiResponse.error(
        res,
        `Invalid role specified. Supported registration roles: '${ROLES.STUDENT}', '${ROLES.INSTITUTION}'.`,
        400
      );
    }

    // ============================================================
    // 5. CHECK EXISTING USER
    // ============================================================

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return ApiResponse.error(
        res,
        'An account with this email address already exists. Please log in.',
        409
      );
    }

    // ============================================================
    // 6. DEFAULT INSTITUTION VALUES
    // ============================================================

    let resolvedInstitutionId = null;
    let resolvedInstitutionCode = null;
    let resolvedInstitutionName = null;

    // ============================================================
    // 7. INSTITUTION ACCOUNT REGISTRATION
    // ============================================================

    if (normalizedRole === ROLES.INSTITUTION) {
      if (!institutionName || !institutionCode) {
        return ApiResponse.error(
          res,
          'Institution name and institution code are required for institution registration.',
          400
        );
      }

      const normalizedInstitutionCode =
        institutionCode.toUpperCase().trim();

      const normalizedInstitutionName =
        institutionName.trim();

      // Find existing institution by code
      let institution = await Institution.findOne({
        code: normalizedInstitutionCode,
      });

      // Create institution if it does not exist
      if (!institution) {
        institution = await Institution.create({
          name: normalizedInstitutionName,
          code: normalizedInstitutionCode,
          contactEmail: normalizedEmail,
          verificationStatus: 'VERIFIED',
        });

        console.log(
          `🏛️ Institution created: ${institution.name} [${institution.code}]`
        );
      }

      // Store institution details in the user account
      resolvedInstitutionId = institution._id;
      resolvedInstitutionCode = institution.code;
      resolvedInstitutionName = institution.name;
    }

    // ============================================================
    // 8. STUDENT ACCOUNT REGISTRATION
    // ============================================================

    if (normalizedRole === ROLES.STUDENT) {
      // Student MUST select an institution
      if (!institutionId) {
        return ApiResponse.error(
          res,
          'Please select your institution before creating a student account.',
          400
        );
      }

      // Find selected institution
      const institution = await Institution.findById(
        institutionId
      );

      if (!institution) {
        return ApiResponse.error(
          res,
          'Selected institution was not found.',
          404
        );
      }

      // Only verified institutions can accept students
      if (
        String(institution.verificationStatus).toUpperCase() !==
        'VERIFIED'
      ) {
        return ApiResponse.error(
          res,
          'Selected institution is not verified.',
          403
        );
      }

      // Store institution relationship
      resolvedInstitutionId = institution._id;
      resolvedInstitutionCode = institution.code;
      resolvedInstitutionName = institution.name;

      console.log(
        `🎓 Student institution linked: ${institution.name} [${institution.code}]`
      );
    }

    // ============================================================
    // 9. CREATE USER
    // ============================================================

    const newUser = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      // User model pre-save hook should hash this password
      passwordHash: password,

      role: normalizedRole,

      // Student ID / ABC ID
      studentId:
        normalizedRole === ROLES.STUDENT
          ? studentId?.trim() ||
            `ABC-${Date.now().toString().slice(-6)}`
          : null,

      // Institution relationship
      institutionId: resolvedInstitutionId,

      institutionCode: resolvedInstitutionCode,

      institutionName: resolvedInstitutionName,

      isActive: true,
    });

    // ============================================================
    // 10. GENERATE JWT
    // ============================================================

    const token = generateToken(newUser);

    // ============================================================
    // 11. RESPONSE
    // ============================================================

    return ApiResponse.created(
      res,
      {
        user: newUser,
        token,
      },
      `Successfully registered as ${normalizedRole.toUpperCase()}. Welcome to NEP Academic Credit Hub.`
    );
  } catch (error) {
    console.error('Registration Error:', error);

    return ApiResponse.error(
      res,
      error.message || 'Registration failed.',
      500
    );
  }
};

/**
 * Login existing user
 *
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ============================================================
    // 1. VALIDATION
    // ============================================================

    if (!email || !password) {
      return ApiResponse.error(
        res,
        'Email and password are required.',
        400
      );
    }

    // ============================================================
    // 2. FIND USER
    // ============================================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return ApiResponse.error(
        res,
        'Invalid credentials. User not found.',
        401
      );
    }

    // ============================================================
    // 3. CHECK ACTIVE STATUS
    // ============================================================

    if (!user.isActive) {
      return ApiResponse.error(
        res,
        'Account has been deactivated. Please contact support.',
        403
      );
    }

    // ============================================================
    // 4. COMPARE PASSWORD
    // ============================================================

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return ApiResponse.error(
        res,
        'Invalid credentials. Incorrect password.',
        401
      );
    }

    // ============================================================
    // 5. GENERATE TOKEN
    // ============================================================

    const token = generateToken(user);

    // ============================================================
    // 6. RESPONSE
    // ============================================================

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

    return ApiResponse.error(
      res,
      error.message || 'Login failed.',
      500
    );
  }
};

/**
 * Get current authenticated user
 *
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
    console.error('Get Me Error:', error);

    return ApiResponse.error(
      res,
      'Failed to fetch user profile',
      500
    );
  }
};

/**
 * Get verified institutions
 *
 * This endpoint is used by the student registration page
 * to populate the institution dropdown.
 *
 * GET /api/auth/institutions
 */
const getInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find({
      verificationStatus: 'VERIFIED',
    })
      .select('_id name code')
      .sort({ name: 1 });

    return ApiResponse.success(
      res,
      {
        institutions,
      },
      'Institutions retrieved successfully'
    );
  } catch (error) {
    console.error('Get Institutions Error:', error);

    return ApiResponse.error(
      res,
      'Failed to load institutions.',
      500
    );
  }
};

/**
 * Internal Admin Bootstrapper
 *
 * Ensures a default administrator exists
 * in development/demo environments.
 */
const ensureAdminAccount = async () => {
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@nep.gov.in';

    const adminPassword =
      process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await User.findOne({
      role: ROLES.ADMIN,
    });

    if (!existingAdmin) {
      await User.create({
        name: 'National Credit Hub Administrator',

        email: adminEmail.toLowerCase().trim(),

        passwordHash: adminPassword,

        role: ROLES.ADMIN,

        isActive: true,
      });

      console.log(
        `🔑 Default Admin initialized: ${adminEmail}`
      );
    }
  } catch (err) {
    console.error(
      'Failed to initialize admin account:',
      err.message
    );
  }
};

module.exports = {
  register,
  login,
  getMe,
  getInstitutions,
  ensureAdminAccount,
};