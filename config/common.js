module.exports = function handleDuplicateKeyError(error) {

    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0]; // Get the field that caused the duplicate key error
        const value = error.keyValue[field]; // Get the value that caused the duplicate key error

        // Generate a user-friendly message
        const friendlyMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use a different ${field}.`;

        return {
            status: 400,
            message: friendlyMessage,
        };
    }

    // If it's not a duplicate key error, return a generic error message
    return {
        status: 500,
        message: 'An unexpected error occurred. Please try again later.',
    };
}

//   module.experts= handleDuplicateKeyError;