import styles from "./RevenueChart.module.css";
import shared from "../shared/chartShared.module.css";

function createPath(values) {
  const max = Math.max(...values);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function RevenueChart({ data }) {
  return (
    <article className={`${shared.card} ${styles.card}`}>
      <p className={shared.eyebrow}>Revenue by Month</p>
      <h3 className={shared.title}>Monthly Revenue Trend</h3>
      <p className={shared.meta}>Steady acceleration through enterprise and dealer channels.</p>
      <svg viewBox="0 0 100 100" className={styles.chart}>
        <defs>
          <linearGradient id="revenueLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
        </defs>
        <path d={createPath(data)} className={styles.line} />
      </svg>
    </article>
  );
}
