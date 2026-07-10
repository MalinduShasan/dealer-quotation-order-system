import BrandLogoPreview from "./BrandLogoPreview";
import { EditIcon } from "../../../components/dashboard/dashboardIcons";
import styles from "../BrandManagement.module.css";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export default function BrandTable({ brands, pagination, canManageBrands, onEdit, onToggleStatus }) {
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created Date</th>
              {canManageBrands ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td data-label="Logo">
                  <BrandLogoPreview logoUrl={brand.logoUrl} alt={`${brand.name} logo`} size="small" />
                </td>
                <td data-label="Name">
                  <div className={styles.primaryCell}>
                    <strong>{brand.name}</strong>
                  </div>
                </td>
                <td data-label="Description">
                  <span className={styles.descriptionText}>{brand.description || "No description"}</span>
                </td>
                <td data-label="Status">
                  <span className={`${styles.badge} ${styles[brand.status]}`}>{brand.status}</span>
                </td>
                <td data-label="Created Date">{formatDate(brand.createdAt)}</td>
                {canManageBrands ? (
                  <td data-label="Actions">
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => onEdit(brand)}
                        aria-label={`Edit ${brand.name}`}
                        title={`Edit ${brand.name}`}
                      >
                        <EditIcon className={styles.actionIcon} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${brand.status === "active" ? styles.actionDanger : styles.actionSuccess}`}
                        onClick={() => onToggleStatus(brand)}
                      >
                        {brand.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationRow}>
        <p className={styles.paginationMeta}>
          {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} brands
        </p>
        <div className={styles.paginationActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
