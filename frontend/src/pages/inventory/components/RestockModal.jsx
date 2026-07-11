import styles from "../InventoryManagement.module.css";

export default function RestockModal({ isOpen, product, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen || !product) return null;

  const quantity = Number(values.quantity || 0);
  const currentStock = Number(product.stockQuantity || 0);
  const newStock = currentStock + (Number.isFinite(quantity) ? quantity : 0);

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Inventory Update</p>
            <h2 className={styles.modalTitle}>Restock Product</h2>
          </div>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Product</label>
            <input className={styles.fieldInput} value={product.name} disabled />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Current Stock</label>
            <input className={styles.fieldInput} value={currentStock} disabled />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="restock-quantity">
              Quantity to Add
            </label>
            <input id="restock-quantity" name="quantity" type="number" min="1" step="1" className={styles.fieldInput} value={values.quantity} onChange={onChange} />
            {errors.quantity ? <span className={styles.fieldError}>{errors.quantity}</span> : null}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>New Stock Preview</label>
            <input className={styles.fieldInput} value={newStock} disabled />
          </div>
          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="restock-reason">
              Reason
            </label>
            <textarea id="restock-reason" name="reason" className={styles.fieldInput} rows={4} value={values.reason} onChange={onChange} />
            {errors.reason ? <span className={styles.fieldError}>{errors.reason}</span> : null}
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "Saving..." : "Save Restock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
