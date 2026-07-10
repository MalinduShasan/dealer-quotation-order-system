import { CheckCircleIcon, WarningIcon, XCircleIcon } from "../../../components/dashboard/dashboardIcons";
import styles from "../ProductManagement.module.css";

export default function ProductInventoryBadge({ product }) {
  let toneClass = styles.inventoryHealthy;
  let label = "Healthy";
  let Icon = CheckCircleIcon;

  if (product.status === "out_of_stock" || Number(product.stockQuantity) === 0) {
    toneClass = styles.inventoryOut;
    label = "Out of Stock";
    Icon = XCircleIcon;
  } else if (product.isLowStock) {
    toneClass = styles.inventoryLow;
    label = "Low Stock";
    Icon = WarningIcon;
  }

  return (
    <div className={styles.inventoryCell}>
      <div className={styles.inventoryStats}>
        <div className={styles.inventoryMetric}>
          <span className={styles.inventoryLabel}>Stock</span>
          <strong className={styles.inventoryValue}>{product.stockQuantity}</strong>
        </div>
        <div className={styles.inventoryMetric}>
          <span className={styles.inventoryLabel}>Minimum</span>
          <strong className={styles.inventoryValue}>{product.minimumStock}</strong>
        </div>
      </div>
      <span className={`${styles.inventoryBadge} ${toneClass}`}>
        <Icon className={styles.inventoryIcon} />
        {label}
      </span>
    </div>
  );
}
