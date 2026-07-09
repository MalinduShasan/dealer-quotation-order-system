import styles from "./QuotationChart.module.css";
import shared from "../shared/chartShared.module.css";

export default function QuotationChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;
  const segments = data.map((item) => {
    const start = cumulative / total;
    cumulative += item.value;
    const end = cumulative / total;
    return { ...item, start, end };
  });

  return (
    <article className={`${shared.card} ${styles.card}`}>
      <p className={shared.eyebrow}>Quotation Status</p>
      <h3 className={shared.title}>Pipeline Composition</h3>
      <div className={styles.donut} style={{ background: `conic-gradient(${segments.map((segment) => `${segment.color} ${segment.start * 100}% ${segment.end * 100}%`).join(", ")})` }}>
        <div className={styles.inner}>
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className={styles.legend}>
        {data.map((item) => (
          <div key={item.label} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
