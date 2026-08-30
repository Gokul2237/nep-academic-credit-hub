const jwt = require('jsonwebtoken');

/**
 * Generate a cryptographically signed JWT access token
 * @param {Object} user - User document
 * @returns {String} JWT Token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    studentId: user.studentId || null,
    institutionId: user.institutionId || null,
    institutionCode: user.institutionCode || null,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

/**
 * Verify a JWT Token
 * @param {String} token 
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
