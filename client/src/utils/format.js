const CURRENCY = 'ZAR';

export const formatMoney = (amount) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: CURRENCY }).format(Number(amount) || 0);

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const shortRef = (id) => String(id || '').slice(0, 8);

// Human-friendly reference shown on receipts, e.g. BK-1A2B3C4D / TXN-9F8E7D6C
export const displayRef = (prefix, id) => `${prefix}-${shortRef(id).toUpperCase()}`;

const monthFmt = new Intl.DateTimeFormat('en-ZA', { month: 'short' });

// Totals per month for the last `count` months (oldest first)
export function monthlyTotals(transactions, count = 6, now = new Date()) {
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthFmt.format(d), total: 0 });
  }
  transactions.forEach((t) => {
    const d = new Date(t.createdAt);
    const month = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (month) month.total = Math.round((month.total + Number(t.amount || 0)) * 100) / 100;
  });
  return months;
}
