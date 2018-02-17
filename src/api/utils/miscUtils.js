const clearErrors = {
  ModelValidation: 'ValidationError',
};

exports.sendError = (res, err) => res.status(exports.getStatusCode(err)).send(err.error || err);
exports.getErrorType = error => clearErrors[error] || error || 'UnknownError';
exports.getErrorData = error => error.data || error.message || 'Can not find error data';
exports.getStatusCode = error => error.status || error.statusCode || 418;
