class APIError {
  /**
   * Creates an API error.
   * @param {string} errorMessage - Error message.
   * @param {object} errorData - More specific information about the error.
   * @param {int} statusCode - Status code to be sent to the user.
   */
  constructor({
    errorMessage,
    errorData,
    statusCode,
  }) {
    this.statusCode = statusCode;
    this.error = {
      message: errorMessage,
      data: errorData,
    };
  }
}

module.exports = APIError;
