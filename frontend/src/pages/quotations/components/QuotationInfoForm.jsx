import styles from "./QuotationBuilder.module.css";

export default function QuotationInfoForm({ values, errors, onChange }) {
  return (
    <section className={styles.sectionCard}>
      <div>
        <p className={styles.eyebrow}>Commercial Details</p>
        <h2 className={styles.sectionTitle}>Quotation Information</h2>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-valid-until">Valid Until</label>
          <input
            id="quotation-valid-until"
            type="date"
            name="valid_until"
            className={styles.fieldInput}
            value={values.valid_until}
            onChange={onChange}
          />
          {errors.valid_until ? <span className={styles.fieldError}>{errors.valid_until}</span> : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-status">Initial Status</label>
          <select
            id="quotation-status"
            name="status"
            className={styles.fieldSelect}
            value={values.status}
            onChange={onChange}
          >
            <option value="draft">Draft</option>
            <option value="approved">Submit for workflow</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-shipping">Shipping Amount</label>
          <input
            id="quotation-shipping"
            type="number"
            min="0"
            step="0.01"
            name="shipping_amount"
            className={styles.fieldInput}
            value={values.shipping_amount}
            onChange={onChange}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-discount">Discount Percentage</label>
          <input
            id="quotation-discount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            name="discount_percentage"
            className={styles.fieldInput}
            value={values.discount_percentage}
            onChange={onChange}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-tax">Tax Percentage</label>
          <input
            id="quotation-tax"
            type="number"
            min="0"
            max="100"
            step="0.01"
            name="tax_percentage"
            className={styles.fieldInput}
            value={values.tax_percentage}
            onChange={onChange}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-currency">Currency</label>
          <input
            id="quotation-currency"
            name="currency_code"
            className={styles.fieldInput}
            value={values.currency_code}
            onChange={onChange}
          />
        </div>
      </div>
    </section>
  );
}
