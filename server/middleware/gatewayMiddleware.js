const crypto = require('crypto');
const APIKey = require('../models/APIKey');
const APILog = require('../models/APILog');
const ApiResponse = require('../utils/apiResponse');

/**
 * Helper to generate APILog ID
 */
const generateLogId = () => {
  return `LOG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * Middleware to authenticate B2B API Gateway requests using cryptographically hashed API keys
 */
const authenticateApiKey = (requiredScope = null) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    let rawKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];

    if (!rawKey && req.headers.authorization && req.headers.authorization.startsWith('Bearer nep_live_')) {
      rawKey = req.headers.authorization.split(' ')[1];
    }

    if (!rawKey) {
      return ApiResponse.error(
        res,
        'API key required. Provide X-API-Key header.',
        401
      );
    }

    try {
      const keyHash = crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
      const apiKeyDoc = await APIKey.findOne({ keyHash }).populate('institutionId');

      if (!apiKeyDoc || !apiKeyDoc.isActive) {
        return ApiResponse.error(res, 'Invalid or revoked API key.', 401);
      }

      if (requiredScope && (!apiKeyDoc.scopes || !apiKeyDoc.scopes.includes(requiredScope))) {
        return ApiResponse.error(
          res,
          `API Key lacks required scope '${requiredScope}'. Granted scopes: [${apiKeyDoc.scopes.join(', ')}]`,
          403
        );
      }

      // Update last used
      apiKeyDoc.lastUsedAt = new Date();
      await apiKeyDoc.save();

      req.gatewayInstitution = apiKeyDoc.institutionId;
      req.apiKey = apiKeyDoc;

      // Wrap res.send to log response stats
      const originalSend = res.send;
      res.send = function (data) {
        const responseTimeMs = Date.now() - startTime;
        APILog.create({
          logId: generateLogId(),
          apiKeyId: apiKeyDoc._id,
          institutionId: apiKeyDoc.institutionId._id || apiKeyDoc.institutionId,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode: res.statusCode,
          responseTimeMs,
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'B2B-Gateway-Client',
        }).catch((err) => console.error('APILog write error:', err.message));

        return originalSend.apply(res, arguments);
      };

      next();
    } catch (error) {
      console.error('API Gateway Authentication Error:', error);
      return ApiResponse.error(res, 'API Gateway authentication error.', 500);
    }
  };
};

module.exports = {
  authenticateApiKey,
};
