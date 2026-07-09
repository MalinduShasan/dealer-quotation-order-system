import styles from "./TopProductsChart.module.css";
import shared from "./chartShared.module.css";

export default function TopProductsChart({ data }) {
  const max = Math.max(...data.map((item) => item.value));

  return (
    <article className={`${shared.card} ${styles.card}`}>
      <p className={shared.eyebrow}>Top Products</p>
      <h3 className={shared.title}>Commercial Winners</h3>
      <div className={styles.list}>
        {data.map((item) => (
          <div key={item.name} className={styles.row}>
            <div className={styles.meta}>
              <strong>{item.name}</strong>
              <span>{item.value} dealer wins</span>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
