import styles from "../ProductDetails.module.css";

export default function ProductDetailActions({
  canManage,
  product,
  onToggleStatus,
  onRestock,
  onAdjust,
  onViewFullHistory,
  isEditing,
  onCancelEdit,
  onSaveInline,
  submitting
}) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Actions</p>
          <h2 className={styles.sectionTitle}>Product Controls</h2>
        </div>
      </div>

      <div className={styles.actionStack}>
        {canManage ? (
          <>
            <button
              type="button"
              className={product.status === "active" ? styles.dangerButton : styles.secondaryButton}
              onClick={() => onToggleStatus(product)}
            >
              {product.status === "active" ? "Deactivate Product" : "Activate Product"}
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => onRestock(product)}>
              Restock
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => onAdjust(product)}>
              Adjust Stock
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onViewFullHistory}>
              View Full History
            </button>
            <button type="button" className={styles.disabledButton} disabled>
              Archive Product
            </button>
            {isEditing ? (
              <>
                <button type="button" className={styles.secondaryButton} onClick={onCancelEdit} disabled={submitting}>
                  Cancel Edit
                </button>
                <button type="button" className={styles.primaryButton} onClick={onSaveInline} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
