import styles from "./QuotationBuilder.module.css";

export default function QuotationBuilderActions({ isEditMode, submitting, onCancel, onSaveDraft, onSubmitWorkflow }) {
  return (
    <section className={styles.summaryCard}>
      <div>
        <p className={styles.eyebrow}>Actions</p>
        <h2 className={styles.sectionTitle}>Quotation Controls</h2>
      </div>

      <div className={styles.actionsRow}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <div className={styles.inlineButtonRow}>
          <button type="button" className={styles.ghostButton} onClick={onSaveDraft} disabled={submitting}>
            {submitting ? "Saving..." : isEditMode ? "Save Draft Changes" : "Save Draft"}
          </button>
          <button type="button" className={styles.primaryButton} onClick={onSubmitWorkflow} disabled={submitting}>
            {submitting ? "Submitting..." : isEditMode ? "Update and Submit" : "Create and Submit"}
          </button>
        </div>
      </div>
    </section>
  );
}
