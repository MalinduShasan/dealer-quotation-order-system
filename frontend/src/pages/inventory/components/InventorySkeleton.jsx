import styles from "../InventoryManagement.module.css";

export default function InventorySkeleton({ cards = 6 }) {
  return (
    <div className={styles.inventoryGrid}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className={styles.skeletonCard} aria-hidden="true">
          <div className={styles.skeletonThumb} />
          <div className={styles.skeletonLineLg} />
          <div className={styles.skeletonLineMd} />
          <div className={styles.skeletonMetrics}>
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
          </div>
          <div className={styles.skeletonActions}>
            <div className={styles.skeletonButton} />
            <div className={styles.skeletonButton} />
          </div>
        </div>
      ))}
    </div>
  );
}
