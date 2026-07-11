import { useEffect } from "react";
import MovementTypeBadge from "./MovementTypeBadge";
import StockHealthBadge from "./StockHealthBadge";
import styles from "./StockHistoryDrawer.module.css";

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

export default function StockHistoryDrawer({ isOpen, product, items, loading, error, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} stock history`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Product History</p>
            <h2 className={styles.title}>{product.name}</h2>
            <p className={styles.meta}>SKU: {product.sku}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close stock history">
            Close
          </button>
        </div>

        <div className={styles.summary}>
          <p className={styles.meta}>Current Stock: <span className={styles.metaValue}>{product.stockQuantity}</span></p>
          <p className={styles.meta}>Minimum Stock: <span className={styles.metaValue}>{product.minimumStock}</span></p>
          <StockHealthBadge value={product.stockHealth} />
        </div>

        {loading ? <p className={styles.emptyText}>Loading history...</p> : null}
        {!loading && error ? <p className={styles.emptyText}>{error}</p> : null}
        {!loading && !error && items.length === 0 ? <p className={styles.emptyText}>No inventory movements found yet.</p> : null}

        {!loading && !error && items.length > 0 ? (
          <div className={styles.historyList}>
            {items.map((item) => (
              <article key={item.id} className={styles.historyCard}>
                <div className={styles.historyHeader}>
                  <h3 className={styles.historyTitle}>{formatDate(item.createdAt)}</h3>
                  <MovementTypeBadge value={item.movementType} />
                </div>
                <div className={styles.metaGrid}>
                  <p className={styles.meta}>Quantity: <span className={styles.metaValue}>{item.quantity}</span></p>
                  <p className={styles.meta}>Previous: <span className={styles.metaValue}>{item.previousQuantity}</span></p>
                  <p className={styles.meta}>New: <span className={styles.metaValue}>{item.newQuantity}</span></p>
                  <p className={styles.meta}>Changed By: <span className={styles.metaValue}>{item.createdByName || "System"}</span></p>
                  <p className={styles.meta}>Reason: <span className={styles.metaValue}>{item.reason}</span></p>
                  <p className={styles.meta}>
                    Reference: <span className={styles.metaValue}>{item.referenceType ? `${item.referenceType}${item.referenceId ? ` • ${item.referenceId}` : ""}` : "N/A"}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
