import styles from "./QuotationBuilder.module.css";

export default function QuotationTerms({ values, onChange }) {
  return (
    <section className={styles.sectionCard}>
      <div>
        <p className={styles.eyebrow}>Terms</p>
        <h2 className={styles.sectionTitle}>Commercial Terms</h2>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="quotation-terms">Terms & Conditions</label>
        <textarea
          id="quotation-terms"
          name="terms"
          className={styles.fieldTextarea}
          value={values.terms}
          onChange={onChange}
        />
      </div>
    </section>
  );
}
