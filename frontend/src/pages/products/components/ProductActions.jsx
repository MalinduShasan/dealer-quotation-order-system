import { EditIcon, WarningIcon } from "../../../components/dashboard/dashboardIcons";
import styles from "../ProductManagement.module.css";

export default function ProductActions({
  product,
  canManage,
  onView,
  onEdit,
  onToggleStatus,
  onImagePreview
}) {
  return (
    <div className={styles.actionRow}>
      <button type="button" className={styles.viewButton} onClick={() => onView(product)}>
        View
      </button>
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
            onClick={() => onImagePreview(product)}
            aria-label={`Manage image for ${product.name}`}
            title={`Manage image for ${product.name}`}
          >
            <WarningIcon className={styles.actionIcon} />
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${product.status === "active" ? styles.actionDanger : styles.actionSuccess}`}
            onClick={() => onToggleStatus(product)}
          >
            {product.status === "active" ? "Deactivate" : "Activate"}
          </button>
        </>
      ) : null}
    </div>
  );
}
