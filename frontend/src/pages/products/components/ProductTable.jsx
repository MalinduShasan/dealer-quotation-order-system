import ProductRow from "./ProductRow";
import styles from "../ProductManagement.module.css";

export default function ProductTable({
  products,
  pagination,
  canManage,
  onView,
  onEdit,
  onToggleStatus,
  onImagePreview
}) {
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.productColumn} />
            <col className={styles.pricingColumn} />
            <col className={styles.inventoryColumn} />
            <col className={styles.statusColumn} />
            <col className={styles.createdColumn} />
            <col className={styles.actionsColumn} />
          </colgroup>
          <thead>
            <tr>
              <th>Product</th>
              <th>Pricing</th>
              <th>Inventory</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                canManage={canManage}
                onView={onView}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onImagePreview={onImagePreview}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationRow}>
        <p className={styles.paginationMeta}>
          {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} products
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
