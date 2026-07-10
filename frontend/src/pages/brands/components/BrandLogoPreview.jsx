import styles from "../BrandManagement.module.css";

export default function BrandLogoPreview({ logoUrl, alt, size = "large" }) {
  const sizeClass = size === "small" ? styles.logoPreviewSmall : styles.logoPreviewLarge;

  return (
    <div className={`${styles.logoPreviewFrame} ${sizeClass}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={alt} className={styles.logoPreviewImage} />
      ) : (
        <span className={styles.logoPreviewFallback}>No Logo</span>
      )}
    </div>
  );
}
