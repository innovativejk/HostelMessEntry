// backend/utils/helpers.js

/**
 * Generates a random string of a given length.
 * Useful for IDs, tokens, etc. (though not for secure tokens like JWTs).
 * @param {number} length - The desired length of the string.
 * @returns {string} A random string.
 */
export const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * Formats a date object into 'YYYY-MM-DD' string.
 * @param {Date} date - The date object to format.
 * @returns {string} Formatted date string.
 */
export const formatDateToYYYYMMDD = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Add more helper functions as needed, e.g., for data manipulation, formatting.