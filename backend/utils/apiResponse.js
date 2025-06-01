// backend/utils/apiResponse.js

/**
 * Standardized success API response.
 * @param {object} res - Express response object.
 * @param {string} message - A descriptive success message.
 * @param {object} [data={}] - The actual data payload.
 * @param {number} [statusCode=200] - HTTP status code.
 */
export const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standardized error API response.
 * @param {object} res - Express response object.
 * @param {string} message - A descriptive error message.
 * @param {number} [statusCode=500] - HTTP status code.
 * @param {Array<object>} [errors=[]] - Array of detailed error objects (e.g., from validation).
 */
export const errorResponse = (res, message, statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : [{ msg: message }], // Ensures there's always an error object
  });
};

// Example usage in a controller:
// import { successResponse, errorResponse } from '../utils/apiResponse.js';
//
// export const getSomeData = asyncHandler(async (req, res) => {
//   const data = await someService.fetchData();
//   if (data) {
//     successResponse(res, 'Data fetched successfully', data);
//   } else {
//     errorResponse(res, 'Data not found', 404);
//   }
// });