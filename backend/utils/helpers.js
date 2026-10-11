const crypto = require('crypto');

/**
 * Generate unique human-readable identifier
 * @param {string} prefix
 * @returns {string}
 */
const generateId = (prefix = 'DL') => {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const timestampPart = Date.now().toString().slice(-4);
  return `${prefix}-${year}-${randomHex}${timestampPart}`;
};

/**
 * Format currency in Indian Rupees (INR)
 * @param {number} amount
 * @returns {string}
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Calculate due date based on days
 * @param {number} days
 * @returns {Date}
 */
const getDueDate = (days = 15) => {
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target;
};

module.exports = {
  generateId,
  formatCurrency,
  getDueDate,
};
