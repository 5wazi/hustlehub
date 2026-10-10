const env = require('../config/env');
const { transactions } = require('../models/collections');
const userStore = require('../models/userStore');
const asyncHandler = require('../utils/asyncHandler');

const nameOf = (id) => {
  const u = userStore.findById(id);
  return u ? u.name : 'Unknown';
};
const enrich = (t) => ({ ...t, clientName: nameOf(t.clientId), freelancerName: nameOf(t.freelancerId) });
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

// Client: payments made. Freelancer: income records.
const myTransactions = asyncHandler(async (req, res) => {
  const mine = transactions
    .filter((t) => (req.user.role === 'client' ? t.clientId === req.user.id : t.freelancerId === req.user.id))
    .sort(newestFirst);
  res.json({ status: 'success', data: { transactions: mine.map(enrich) } });
});

// Freelancer: income earned + a simple flat-rate tax estimate.
// Sums in integer cents to avoid floating-point drift.
const getIncome = asyncHandler(async (req, res) => {
  const mine = transactions.filter((t) => t.freelancerId === req.user.id && t.status === 'completed');
  const totalCents = mine.reduce((sum, t) => sum + Math.round(t.amount * 100), 0);
  const taxCents = Math.round(totalCents * env.taxRate);

  res.json({
    status: 'success',
    data: {
      currency: env.currency,
      bookingCount: mine.length,
      totalEarned: totalCents / 100,
      estimatedTaxRate: env.taxRate,
      estimatedTax: taxCents / 100,
      estimatedNetIncome: (totalCents - taxCents) / 100,
      disclaimer: 'Illustrative flat-rate estimate only. This is not tax advice.',
    },
  });
});

const listAllTransactions = asyncHandler(async (req, res) => {
  res.json({ status: 'success', data: { transactions: transactions.all().sort(newestFirst).map(enrich) } });
});

module.exports = { myTransactions, getIncome, listAllTransactions };
