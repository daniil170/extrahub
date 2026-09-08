/**
 * @typedef {'pending' | 'paid' | 'overdue'} PaymentStatus
 */

/**
 * @typedef {Object} Payment
 * @property {string} id - Unique payment record ID
 * @property {string} studentId - Student identifier
 * @property {string} activityId - Activity identifier
 * @property {number} amount - Amount in currency units
 * @property {string} dueDate - ISO date string (YYYY-MM-DD)
 * @property {PaymentStatus} status - Payment settlement status
 * @property {string} [updatedBy] - User ID of who last updated the payment
 * @property {string} updatedAt - ISO date string
 */

/**
 * Factory function to create a Payment entity
 * @param {Partial<Payment>} data
 * @returns {Payment}
 */
export function createPayment(data = {}) {
  return {
    id: data.id || '',
    studentId: data.studentId || '',
    activityId: data.activityId || '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    dueDate: data.dueDate || '',
    status: data.status || 'pending',
    updatedBy: data.updatedBy || '',
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
};
