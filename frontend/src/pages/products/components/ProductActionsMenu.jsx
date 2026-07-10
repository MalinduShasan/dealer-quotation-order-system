import { useEffect, useRef, useState } from "react";
import { EditIcon, MenuIcon } from "../../../components/dashboard/dashboardIcons";
import styles from "../ProductManagement.module.css";

export default function ProductActionsMenu({
  product,
  canManage,
  onView,
  onEdit,
  onToggleStatus,
  onImagePreview,
  showViewButton = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.actionsShell} ref={containerRef}>
      {showViewButton ? (
        <button type="button" className={styles.viewButton} onClick={() => onView(product)}>
          View
        </button>
      ) : null}

      {canManage ? (
        <>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onEdit(product)}
            aria-label={`Edit ${product.name}`}
            title={`Edit ${product.name}`}
          >
            <EditIcon className={styles.actionIcon} />
          </button>

          <button
            type="button"
            className={styles.actionButton}
            onClick={() => setIsOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={`More actions for ${product.name}`}
            title={`More actions for ${product.name}`}
          >
            <MenuIcon className={styles.actionIcon} />
          </button>

          {isOpen ? (
            <div className={styles.actionsMenu} role="menu">
              <button
                type="button"
                className={styles.actionsMenuItem}
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onImagePreview(product);
                }}
              >
                Replace Image
              </button>
              <button
                type="button"
                className={styles.actionsMenuItem}
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onToggleStatus(product);
                }}
              >
                {product.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button type="button" className={`${styles.actionsMenuItem} ${styles.actionsMenuItemDisabled}`} role="menuitem" disabled>
                Archive
              </button>
              <button type="button" className={`${styles.actionsMenuItem} ${styles.actionsMenuItemDisabled}`} role="menuitem" disabled>
                Duplicate Product
              </button>
              <button type="button" className={`${styles.actionsMenuItem} ${styles.actionsMenuItemDisabled}`} role="menuitem" disabled>
                Export
              </button>
              <button type="button" className={`${styles.actionsMenuItem} ${styles.actionsMenuItemDisabled}`} role="menuitem" disabled>
                Delete
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
