import styles from "./QuotationBuilder.module.css";

export default function QuotationNotes({ values, onChange }) {
  return (
    <section className={styles.sectionCard}>
      <div>
        <p className={styles.eyebrow}>Notes</p>
        <h2 className={styles.sectionTitle}>Internal and Dealer Notes</h2>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-internal-notes">Internal Notes</label>
          <textarea
            id="quotation-internal-notes"
            name="internal_notes"
            className={styles.fieldTextarea}
            value={values.internal_notes}
            onChange={onChange}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="quotation-dealer-notes">Dealer Notes</label>
          <textarea
            id="quotation-dealer-notes"
            name="dealer_notes"
            className={styles.fieldTextarea}
            value={values.dealer_notes}
            onChange={onChange}
          />
        </div>
      </div>
    </section>
  );
}
