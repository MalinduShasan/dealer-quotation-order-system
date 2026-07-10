import { useRef } from "react";
import styles from "../ProductManagement.module.css";

function ProductImagePreview({ imageUrl, alt, size = "large" }) {
  const sizeClass = size === "thumbnail" ? styles.imagePreviewThumbnail : styles.imagePreviewLarge;

  return (
    <div className={`${styles.imagePreviewFrame} ${sizeClass}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className={styles.imagePreviewImage} />
      ) : (
        <span className={styles.imagePreviewFallback}>No Image</span>
      )}
    </div>
  );
}

export default function ProductImageUploader({
  previewUrl,
  disabled,
  isUploading,
  error,
  hasExistingImage,
  onFileSelect,
  onRemove
}) {
  const inputRef = useRef(null);

  const openPicker = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    event.target.value = "";
  };

  return (
    <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
      <label className={styles.fieldLabel} htmlFor="product-image-upload">
        Product Image
      </label>
      <div
        className={styles.uploaderCard}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        role="presentation"
      >
        <ProductImagePreview imageUrl={previewUrl} alt="Product image preview" />
        <div className={styles.uploaderContent}>
          <p className={styles.pageDescription}>Upload a clear catalog image in PNG, JPG, or WEBP format up to 3 MB.</p>
          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={openPicker} disabled={disabled}>
              {previewUrl ? "Replace Image" : "Choose Image"}
            </button>
            {hasExistingImage || previewUrl ? (
              <button type="button" className={styles.actionButton} onClick={onRemove} disabled={disabled}>
                Remove Image
              </button>
            ) : null}
          </div>
          {isUploading ? <p className={styles.helperText}>Uploading product image...</p> : null}
          {error ? <span className={styles.fieldError}>{error}</span> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        id="product-image-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
