import styles from "./RecentSalesChart.module.css";
import shared from "./chartShared.module.css";

export default function RecentSalesChart({ data }) {
  const max = Math.max(...data);
  const points = data
    .map((value, index) => `${(index / (data.length - 1)) * 100},${100 - (value / max) * 72}`)
    .join(" ");

  return (
    <article className={`${shared.card} ${styles.card}`}>
      <p className={shared.eyebrow}>Recent Sales</p>
      <h3 className={shared.title}>Trend Snapshot</h3>
      <svg viewBox="0 0 100 100" className={styles.chart}>
        <polyline points={points} className={styles.line} />
      </svg>
      <p className={shared.meta}>Live sales pulse from the most recent commercial cycle.</p>
    </article>
  );
}
