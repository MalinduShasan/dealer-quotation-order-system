import styles from "./OrdersChart.module.css";
import shared from "../shared/chartShared.module.css";

export default function OrdersChart({ data }) {
  const max = Math.max(...data);

  return (
    <article className={`${shared.card} ${styles.card}`}>
      <p className={shared.eyebrow}>Orders per Month</p>
      <h3 className={shared.title}>Operational Throughput</h3>
      <p className={shared.meta}>Bar view of executed order volume across the year.</p>
      <div className={styles.bars}>
        {data.map((value, index) => (
          <div key={index} className={styles.barWrap}>
            <div className={styles.bar} style={{ height: `${(value / max) * 100}%` }} />
            <span>{index + 1}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
