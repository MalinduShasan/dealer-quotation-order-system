import styles from "../QuotationManagement.module.css";

export default function QuotationEmptyState({ title, message }) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
