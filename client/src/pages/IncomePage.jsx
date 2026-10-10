import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ApiErrorAlert } from '../components/Alert';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import IncomeChart from '../components/IncomeChart';
import { displayRef, formatDate, formatMoney, monthlyTotals } from '../utils/format';

export default function IncomePage() {
  const [income, setIncome] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/income'), api.get('/transactions/mine')])
      .then(([inc, tx]) => {
        setIncome(inc.data);
        setTransactions(tx.data.transactions);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page">
      <header className="page-head">
        <h1>Income</h1>
      </header>
      <ApiErrorAlert error={error} />
      {loading && <Loading label="Loading income" />}
      {income && (
        <div className="earnings">
          <div className="earnings-total">
            <p className="earnings-label">Total earned</p>
            <p className="earnings-figure">{formatMoney(income.totalEarned)}</p>
            <p className="muted">
              From {income.bookingCount} {income.bookingCount === 1 ? 'booking' : 'bookings'}
            </p>
          </div>
          <dl className="earnings-tax">
            <div>
              <dt>Estimated tax ({Math.round(income.estimatedTaxRate * 100)}%)</dt>
              <dd>{formatMoney(income.estimatedTax)}</dd>
            </div>
            <div>
              <dt>Estimated net</dt>
              <dd>{formatMoney(income.estimatedNetIncome)}</dd>
            </div>
            <p className="muted small">{income.disclaimer}</p>
          </dl>
          <IncomeChart months={monthlyTotals(transactions.filter((t) => t.status === 'completed'))} />
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 className="section-title">Transactions</h2>
          {transactions.length === 0 ? (
            <EmptyState title="No income yet">
              <p>
                Bookings on your gigs record a transaction here. <Link to="/my-gigs">Check your gigs are live.</Link>
              </p>
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Transaction</th>
                    <th scope="col">Gig</th>
                    <th scope="col">Client</th>
                    <th scope="col">Booking</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="nowrap ref">{displayRef('TXN', t.id)}</td>
                      <td>{t.gigTitle}</td>
                      <td>{t.clientName}</td>
                      <td className="nowrap">
                        <Link to={`/bookings/${t.bookingId}`} className="ref">
                          {displayRef('BK', t.bookingId)}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="nowrap">{formatDate(t.createdAt)}</td>
                      <td className="num">{formatMoney(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
