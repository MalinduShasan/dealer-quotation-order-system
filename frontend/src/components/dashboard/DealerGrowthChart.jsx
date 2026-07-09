import styles from "./DealerGrowthChart.module.css";
import shared from "./chartShared.module.css";

export default function DealerGrowthChart({ data }) {
  const max = Math.max(...data);
  const points = data
    .map((value, index) => `${(index / (data.length - 1)) * 100},${100 - (value / max) * 70}`)
    .join(" ");

  return (
    <article className={`${shared.card} ${styles.card}`}>
      <p className={shared.eyebrow}>Dealer Growth</p>
      <h3 className={shared.title}>Partner Expansion</h3>
      <svg viewBox="0 0 100 100" className={styles.chart}>
        <polyline points={`0,100 ${points} 100,100`} className={styles.area} />
        <polyline points={points} className={styles.line} />
      </svg>
    </article>
  );
}
