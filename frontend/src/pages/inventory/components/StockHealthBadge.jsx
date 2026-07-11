import styles from "../InventoryManagement.module.css";
import {
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon
} from "../../../components/dashboard/dashboardIcons";

const config = {
  healthy: { label: "Healthy", icon: CheckCircleIcon, tone: "success" },
  low_stock: { label: "Low Stock", icon: WarningIcon, tone: "warning" },
  out_of_stock: { label: "Out of Stock", icon: XCircleIcon, tone: "danger" }
};

export default function StockHealthBadge({ value }) {
  const current = config[value] || config.healthy;
  const Icon = current.icon;

  return (
    <span className={`${styles.badge} ${styles[`badge${current.tone}`]}`}>
      <Icon className={styles.badgeIcon} />
      {current.label}
    </span>
  );
}
