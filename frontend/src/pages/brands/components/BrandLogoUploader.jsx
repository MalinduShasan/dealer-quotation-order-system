import { useRef } from "react";
import styles from "../BrandManagement.module.css";
import BrandLogoPreview from "./BrandLogoPreview";

export default function BrandLogoUploader({
  previewUrl,
  error,
  disabled,
  isUploading,
  hasExistingLogo,
  onFileSelect,
  onRemove
}) {
  const inputRef = useRef(null);

  const openPicker = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    event.target.value = "";
  };

  return (
    <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
      <label className={styles.fieldLabel} htmlFor="brand-logo-upload">
        Brand Logo
      </label>

      <div
        className={`${styles.logoUploader} ${error ? styles.logoUploaderError : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        role="presentation"
      >
        <BrandLogoPreview logoUrl={previewUrl} alt="Brand logo preview" />
        <div className={styles.logoUploaderContent}>
          <p className={styles.logoUploaderTitle}>Upload a square or transparent brand logo</p>
          <p className={styles.logoUploaderMeta}>PNG, JPG, WEBP, or SVG up to 2 MB.</p>
          <div className={styles.logoUploaderActions}>
            <button type="button" className={styles.secondaryButton} onClick={openPicker} disabled={disabled}>
              {previewUrl ? "Replace Logo" : "Choose Logo"}
            </button>
            {hasExistingLogo || previewUrl ? (
              <button type="button" className={styles.actionButton} onClick={onRemove} disabled={disabled}>
                Remove Logo
              </button>
            ) : null}
          </div>
          {isUploading ? <p className={styles.logoUploadingText}>Uploading logo...</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        id="brand-logo-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        disabled={disabled}
      />

      {error ? <span className={styles.fieldError}>{error}</span> : null}
    </div>
  );
}
