/**
 * Standardized JSON API Response Helpers
 */

class ApiResponse {
  static success(res, data = null, message = 'Operation successful', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static paginated(res, data = [], total = 0, page = 1, limit = 10, message = 'Data retrieved successfully', summary = null) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.max(1, Number(limit) || 10);
    const totalPages = Math.max(1, Math.ceil(total / parsedLimit));
    const responsePayload = {
      success: true,
      message,
      data,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      },
      timestamp: new Date().toISOString(),
    };

    if (summary) {
      responsePayload.summary = summary;
    }

    return res.status(200).json(responsePayload);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
