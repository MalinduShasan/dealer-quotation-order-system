import RecentMovementCards from "./RecentMovementCards";
import RecentMovementTable from "./RecentMovementTable";
import styles from "../InventoryManagement.module.css";

export default function StockMovementHistory({ items, title = "Stock Movement History", pagination, onPageChange }) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Recent Movements</p>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
      </div>

      <div className={styles.desktopMovements}>
        <RecentMovementTable items={items} />
      </div>
      <div className={styles.mobileMovements}>
        <RecentMovementCards items={items} />
      </div>

      {pagination && onPageChange ? (
        <div className={styles.paginationRow}>
          <p className={styles.paginationMeta}>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className={styles.paginationActions}>
            <button type="button" className={styles.secondaryButton} disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
              Previous
            </button>
            <button type="button" className={styles.secondaryButton} disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
