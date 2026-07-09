import styles from "./LowStockPanel.module.css";
import shared from "../shared/panelShared.module.css";
import { WarningIcon } from "../dashboardIcons";

export default function LowStockPanel({ rows }) {
  return (
    <article className={shared.panel}>
      <p className={shared.eyebrow}>Low Stock</p>
      <h3 className={shared.title}>Inventory Watchlist</h3>
      <div className={styles.list}>
        {rows.map((row) => (
          <div key={row.sku} className={styles.row}>
            <WarningIcon className={styles.icon} />
            <div className={styles.meta}>
              <strong>{row.product}</strong>
              <span>{row.sku}</span>
            </div>
            <div className={styles.stock}>
              <strong>{row.current}</strong>
              <span>Min {row.minimum}</span>
            </div>
            <span className={styles.status}>{row.status}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
