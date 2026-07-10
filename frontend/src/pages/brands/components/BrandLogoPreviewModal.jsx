import { useEffect, useRef } from "react";
import BrandLogoPreview from "./BrandLogoPreview";
import styles from "./BrandLogoPreviewModal.module.css";

function formatDate(value) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export default function BrandLogoPreviewModal({
  brand,
  isOpen,
  canManage,
  loading,
  onClose,
  onReplaceLogo,
  onRemoveLogo
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !brand) return null;

  const openPicker = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onReplaceLogo(file);
    }
    event.target.value = "";
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-logo-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Brand Logo Preview</p>
            <h2 id="brand-logo-preview-title" className={styles.title}>
              {brand.name}
            </h2>
          </div>
          <button ref={closeButtonRef} type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.previewPanel}>
            <BrandLogoPreview logoUrl={brand.logoUrl} alt={`${brand.name} logo`} size="modal" />
          </div>

          <div className={styles.detailsPanel}>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Description</span>
              <p className={styles.detailValue}>{brand.description || "No description available."}</p>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <span className={styles.detailLabel}>Status</span>
                <p className={styles.detailValue}>{brand.status}</p>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.detailLabel}>Created</span>
                <p className={styles.detailValue}>{formatDate(brand.createdAt)}</p>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.detailLabel}>Updated</span>
                <p className={styles.detailValue}>{formatDate(brand.updatedAt)}</p>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.detailLabel}>Storage Path</span>
                <p className={styles.detailValue}>{brand.logoPath || "No storage path available"}</p>
              </div>
            </div>

            {!brand.logoUrl && !canManage ? <p className={styles.emptyText}>No logo uploaded.</p> : null}
          </div>
        </div>

        <div className={styles.actions}>
          {canManage ? (
            <>
              <button type="button" className={styles.secondaryButton} onClick={openPicker} disabled={loading}>
                {brand.logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={onRemoveLogo}
                disabled={loading || !brand.logoUrl}
              >
                Remove Logo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.hiddenInput}
                onChange={handleFileChange}
              />
            </>
          ) : null}
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
