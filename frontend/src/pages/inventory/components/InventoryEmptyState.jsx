import styles from "../InventoryManagement.module.css";

export default function InventoryEmptyState({ title, message }) {
  return (
    <div className={styles.emptyStateCard}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
