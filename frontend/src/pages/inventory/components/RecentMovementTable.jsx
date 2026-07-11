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

export default function RecentMovementTable({ items }) {
  return (
    <div className={styles.movementTableWrap}>
      <table className={styles.movementTable}>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Product</th>
            <th>Movement Type</th>
            <th>Quantity</th>
            <th>Previous Stock</th>
            <th>New Stock</th>
            <th>Reason</th>
            <th>Changed By</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{formatDate(item.createdAt)}</td>
              <td>{item.product?.name || "N/A"}</td>
              <td><MovementTypeBadge value={item.movementType} /></td>
              <td>{item.quantity}</td>
              <td>{item.previousQuantity}</td>
              <td>{item.newQuantity}</td>
              <td>{item.reason}</td>
              <td>{item.createdByName || "System"}</td>
              <td>{item.referenceType ? `${item.referenceType}${item.referenceId ? ` • ${item.referenceId}` : ""}` : "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
