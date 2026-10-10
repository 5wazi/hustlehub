import { formatMoney } from '../utils/format';

// Simple bar chart drawn with SVG attributes (no inline styles, so it works
// under the strict Content Security Policy).
export default function IncomeChart({ months }) {
  const peak = Math.max(...months.map((m) => m.total), 1);
  const W = 60;
  const H = 120;
  return (
    <figure className="chart">
      <figcaption>Income, last six months</figcaption>
      <svg viewBox={`0 0 ${W * months.length} ${H + 34}`} role="img" aria-label="Monthly income bar chart">
        {months.map((m, i) => {
          const h = Math.max(2, Math.round((m.total / peak) * H));
          const isLast = i === months.length - 1;
          return (
            <g key={m.key}>
              <rect
                x={i * W + 14}
                y={H - h + 14}
                width={W - 28}
                height={h}
                rx="3"
                className={isLast ? 'bar bar-current' : 'bar'}
              >
                <title>{`${m.label}: ${formatMoney(m.total)}`}</title>
              </rect>
              <text x={i * W + W / 2} y={H + 30} textAnchor="middle" className="bar-label">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Income per month</caption>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <th scope="row">{m.label}</th>
              <td>{formatMoney(m.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
