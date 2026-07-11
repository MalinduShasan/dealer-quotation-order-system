import MovementTypeBadge from "./MovementTypeBadge";
import styles from "../InventoryManagement.module.css";

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function RecentMovementCards({ items }) {
  return (
    <div className={styles.movementCardList}>
      {items.map((item) => (
        <article key={item.id} className={styles.movementCard}>
          <div className={styles.movementCardHeader}>
            <strong>{formatDate(item.createdAt)}</strong>
            <MovementTypeBadge value={item.movementType} />
          </div>
          <p className={styles.mobileMeta}>Product: {item.product?.name || "N/A"}</p>
          <p className={styles.mobileMeta}>Quantity: {item.quantity}</p>
          <p className={styles.mobileMeta}>Previous: {item.previousQuantity}</p>
          <p className={styles.mobileMeta}>New: {item.newQuantity}</p>
          <p className={styles.mobileMeta}>Reason: {item.reason}</p>
          <p className={styles.mobileMeta}>Changed By: {item.createdByName || "System"}</p>
        </article>
      ))}
    </div>
  );
}
