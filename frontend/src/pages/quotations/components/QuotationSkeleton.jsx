import styles from "../QuotationManagement.module.css";

export default function QuotationSkeleton() {
  return (
    <div className={styles.cardGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={styles.skeletonCard} />
      ))}
    </div>
  );
}
