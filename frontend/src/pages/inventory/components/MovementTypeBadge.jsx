import styles from "../InventoryManagement.module.css";

const labels = {
  initial_stock: "Initial Stock",
  restock: "Restock",
  adjustment_in: "Adjustment In",
  adjustment_out: "Adjustment Out",
  sale: "Sale",
  return: "Return",
  order_cancelled: "Order Cancelled"
};

const toneMap = {
  initial_stock: "info",
  restock: "success",
  adjustment_in: "success",
  adjustment_out: "warning",
  sale: "danger",
  return: "info",
  order_cancelled: "info"
};

export default function MovementTypeBadge({ value }) {
  return <span className={`${styles.badge} ${styles[`badge${toneMap[value] || "info"}`]}`}>{labels[value] || value}</span>;
}
