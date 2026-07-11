import { useRef } from "react";
import styles from "../ProductDetails.module.css";

export default function ProductImageSection({
  product,
  canManage,
  onPreview,
  loading,
  isEditing = false,
  imagePreviewUrl = "",
  imageError = "",
  onImageSelect,
  onImageRemove,
  hasImage = false
}) {
  const inputRef = useRef(null);

  const openPicker = () => {
    if (!loading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    event.target.value = "";
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Media</p>
          <h2 className={styles.sectionTitle}>Product Image</h2>
        </div>
      </div>

      <div className={styles.imagePanel}>
        <div className={styles.imageFrameWrap}>
          <button type="button" className={styles.imageButton} onClick={() => onPreview(product)}>
            <div className={styles.imageFrame}>
              {imagePreviewUrl || product.imageUrl ? (
                <img src={imagePreviewUrl || product.imageUrl} alt={product.name} className={styles.image} loading="lazy" />
              ) : (
                <span className={styles.placeholder}>No Image</span>
              )}
            </div>
          </button>
          {canManage && isEditing ? (
            <div className={styles.imageEditActions}>
              <button
                type="button"
                className={styles.imageReplaceButton}
                onClick={openPicker}
                disabled={loading}
              >
                {loading ? "Updating..." : "Replace Image"}
              </button>
              <button
                type="button"
                className={styles.imageRemoveButton}
                onClick={onImageRemove}
                disabled={loading || !hasImage}
              >
                Remove Image
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.imageActions}>
          {isEditing && imageError ? <span className={styles.inlineError}>{imageError}</span> : null}
        </div>
      </div>

      {isEditing ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={styles.hiddenInput}
          onChange={handleInputChange}
          disabled={loading}
        />
      ) : null}
    </section>
  );
}
