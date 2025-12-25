/**
 * Global Error Handling Middleware
 * Catches all errors passed via next(err) and sends a clean JSON response
 */
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Development vs Production error messaging
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production: Don't leak technical details to the user
        res.status(err.statusCode).json({
            status: err.status,
            message: err.isOperational ? err.message : 'Something went very wrong!'
        });
    }
};

module.exports = globalErrorHandler;