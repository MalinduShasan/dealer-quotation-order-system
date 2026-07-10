import { memo } from "react";
import ProductActionsMenu from "./ProductActionsMenu";
import ProductCardCell from "./ProductCardCell";
import ProductInventoryBadge from "./ProductInventoryBadge";
import ProductPricingCell from "./ProductPricingCell";
import ProductStatusBadge from "./ProductStatusBadge";
import styles from "../ProductManagement.module.css";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function ProductRow({
  product,
  canManage,
  onView,
  onEdit,
  onToggleStatus,
  onImagePreview
}) {
  return (
    <tr className={styles.productRow}>
      <td data-label="Product">
        <ProductCardCell product={product} onImagePreview={onImagePreview} />
      </td>
      <td data-label="Pricing">
        <ProductPricingCell product={product} />
      </td>
      <td data-label="Inventory">
        <ProductInventoryBadge product={product} />
      </td>
      <td data-label="Status">
        <ProductStatusBadge status={product.status} />
      </td>
      <td data-label="Created">
        <span className={styles.createdText}>{formatDate(product.createdAt)}</span>
      </td>
      <td data-label="Actions">
        <ProductActionsMenu
          product={product}
          canManage={canManage}
          onView={onView}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onImagePreview={onImagePreview}
        />
      </td>
    </tr>
  );
}

export default memo(ProductRow);
