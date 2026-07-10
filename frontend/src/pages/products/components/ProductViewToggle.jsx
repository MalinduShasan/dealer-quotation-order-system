import { GridIcon, TableIcon } from "../../../components/dashboard/dashboardIcons";
import styles from "../ProductManagement.module.css";

export default function ProductViewToggle({ value, onChange }) {
  return (
    <div className={styles.viewToggle} role="tablist" aria-label="Product view mode">
      <button
        type="button"
        className={`${styles.viewToggleButton} ${value === "grid" ? styles.viewToggleActive : ""}`}
        onClick={() => onChange("grid")}
        role="tab"
        aria-selected={value === "grid"}
        title="Grid View"
      >
        <GridIcon className={styles.viewToggleIcon} />
        <span>Grid</span>
      </button>
      <button
        type="button"
        className={`${styles.viewToggleButton} ${value === "table" ? styles.viewToggleActive : ""}`}
        onClick={() => onChange("table")}
        role="tab"
        aria-selected={value === "table"}
        title="Table View"
      >
        <TableIcon className={styles.viewToggleIcon} />
        <span>Table</span>
      </button>
    </div>
  );
}
