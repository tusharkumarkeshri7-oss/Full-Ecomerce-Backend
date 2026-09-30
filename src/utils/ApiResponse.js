import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Standardized API Response Structure
 */
export class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {*} data
   * @param {string} message
   * @param {object|null} meta - Optional pagination / metadata
   */
  constructor(statusCode = HTTP_STATUS.OK, data = null, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }

  static success(data, message = 'Success', statusCode = HTTP_STATUS.OK, meta = null) {
    return new ApiResponse(statusCode, data, message, meta);
  }

  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(HTTP_STATUS.CREATED, data, message);
  }

  static noContent(message = 'Resource deleted successfully') {
    return new ApiResponse(HTTP_STATUS.NO_CONTENT, null, message);
  }
}
