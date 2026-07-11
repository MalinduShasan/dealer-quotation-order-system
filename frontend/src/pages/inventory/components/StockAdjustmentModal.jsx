import styles from "../InventoryManagement.module.css";

export default function StockAdjustmentModal({ isOpen, product, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen || !product) return null;

  const quantity = Number(values.quantity || 0);
  const currentStock = Number(product.stockQuantity || 0);
  const newStock = values.adjustmentType === "decrease" ? currentStock - quantity : currentStock + quantity;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Inventory Update</p>
            <h2 className={styles.modalTitle}>Adjust Stock</h2>
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
            <label className={styles.fieldLabel} htmlFor="adjustment-type">
              Adjustment Type
            </label>
            <select id="adjustment-type" name="adjustmentType" className={styles.fieldInput} value={values.adjustmentType} onChange={onChange}>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Current Stock</label>
            <input className={styles.fieldInput} value={currentStock} disabled />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="adjustment-quantity">
              Quantity
            </label>
            <input id="adjustment-quantity" name="quantity" type="number" min="1" step="1" className={styles.fieldInput} value={values.quantity} onChange={onChange} />
            {errors.quantity ? <span className={styles.fieldError}>{errors.quantity}</span> : null}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>New Stock Preview</label>
            <input className={styles.fieldInput} value={newStock} disabled />
            {newStock < 0 ? <span className={styles.fieldError}>Stock cannot become negative</span> : null}
          </div>
          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="adjustment-reason">
              Reason
            </label>
            <textarea id="adjustment-reason" name="reason" className={styles.fieldInput} rows={4} value={values.reason} onChange={onChange} />
            {errors.reason ? <span className={styles.fieldError}>{errors.reason}</span> : null}
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting || newStock < 0}>
              {submitting ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
