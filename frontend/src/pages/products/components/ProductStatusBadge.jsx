import styles from "../ProductManagement.module.css";

export default function ProductStatusBadge({ status }) {
  const statusClass =
    status === "out_of_stock" ? styles.outOfStock : status === "inactive" ? styles.inactive : styles.active;

  return <span className={`${styles.badge} ${statusClass}`}>{status.replaceAll("_", " ")}</span>;
}
