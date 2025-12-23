/**
 * Global Helper Functions
 */

// Formats file sizes for the UI
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Formats MongoDB ISO dates to a readable format
export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Security: Simple string truncation to prevent UI overflow/injection issues
export const truncateString = (str, num) => {
    if (str?.length <= num) return str;
    return str?.slice(0, num) + '...';
};