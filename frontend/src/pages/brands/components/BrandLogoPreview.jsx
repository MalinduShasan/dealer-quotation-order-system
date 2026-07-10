import styles from "../BrandManagement.module.css";

export default function BrandLogoPreview({
  logoUrl,
  alt,
  size = "large",
  interactive = false,
  onClick,
  title,
  buttonRef
}) {
  const sizeClass =
    size === "small"
      ? styles.logoPreviewSmall
      : size === "thumbnail"
        ? styles.logoPreviewThumbnail
        : size === "modal"
          ? styles.logoPreviewModal
          : styles.logoPreviewLarge;

  const content = (
    <div className={`${styles.logoPreviewFrame} ${sizeClass}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={alt} className={styles.logoPreviewImage} />
      ) : (
        <span className={styles.logoPreviewFallback}>No Logo</span>
      )}
    </div>
  );

  if (!interactive) {
    return content;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.logoPreviewButton}
      onClick={onClick}
      aria-label={title || alt}
      title={title || alt}
    >
      {content}
    </button>
  );
}
