import styles from "../BrandManagement.module.css";
import BrandLogoUploader from "./BrandLogoUploader";

const statusOptions = ["active", "inactive"];

export default function BrandFormModal({
  isOpen,
  mode,
  values,
  errors,
  submitting,
  logoPreviewUrl,
  hasExistingLogo,
  logoUploading,
  onChange,
  onLogoSelect,
  onLogoRemove,
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="brand-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{mode === "edit" ? "Update Brand" : "New Brand"}</p>
            <h2 id="brand-modal-title" className={styles.modalTitle}>
              {mode === "edit" ? "Edit brand" : "Add brand"}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.formGrid} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="brand-name">
              Name
            </label>
            <input
              id="brand-name"
              name="name"
              className={`${styles.fieldInput} ${errors.name ? styles.fieldInputError : ""}`}
              value={values.name}
              onChange={onChange}
              placeholder="Brand name"
            />
            {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="brand-status">
              Status
            </label>
            <select
              id="brand-status"
              name="status"
              className={`${styles.fieldInput} ${errors.status ? styles.fieldInputError : ""}`}
              value={values.status}
              onChange={onChange}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status ? <span className={styles.fieldError}>{errors.status}</span> : null}
          </div>

          <BrandLogoUploader
            previewUrl={logoPreviewUrl}
            error={errors.logo}
            disabled={submitting || logoUploading}
            isUploading={logoUploading}
            hasExistingLogo={hasExistingLogo}
            onFileSelect={onLogoSelect}
            onRemove={onLogoRemove}
          />

          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="brand-description">
              Description
            </label>
            <textarea
              id="brand-description"
              name="description"
              className={`${styles.fieldInput} ${styles.textArea} ${errors.description ? styles.fieldInputError : ""}`}
              value={values.description}
              onChange={onChange}
              placeholder="Brand description"
              rows={5}
            />
            {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting || logoUploading}>
              {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
