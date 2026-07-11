import ProductImageUploader from "./ProductImageUploader";
import styles from "../ProductManagement.module.css";

const statusOptions = ["active", "inactive", "out_of_stock"];

export default function ProductFormModal({
  isOpen,
  mode,
  values,
  errors,
  categories,
  brands,
  canManage,
  submitting,
  imageUploading,
  imagePreviewUrl,
  hasExistingImage,
  skuLocked = false,
  onChange,
  onImageSelect,
  onImageRemove,
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{mode === "edit" ? "Update Product" : "New Product"}</p>
            <h2 id="product-modal-title" className={styles.modalTitle}>
              {mode === "edit" ? "Edit product" : "Add product"}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.formGrid} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-sku">
              SKU
            </label>
            <input
              id="product-sku"
              name="sku"
              className={`${styles.fieldInput} ${errors.sku ? styles.fieldInputError : ""}`}
              value={values.sku}
              onChange={onChange}
              placeholder="SKU"
              disabled={mode === "edit" && skuLocked}
            />
            {mode === "edit" && skuLocked ? (
              <span className={styles.fieldError}>SKU is locked because this product has inventory or sales history.</span>
            ) : null}
            {errors.sku ? <span className={styles.fieldError}>{errors.sku}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-name">
              Product Name
            </label>
            <input
              id="product-name"
              name="name"
              className={`${styles.fieldInput} ${errors.name ? styles.fieldInputError : ""}`}
              value={values.name}
              onChange={onChange}
              placeholder="Product name"
            />
            {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-category">
              Category
            </label>
            <select
              id="product-category"
              name="categoryId"
              className={`${styles.fieldInput} ${errors.categoryId ? styles.fieldInputError : ""}`}
              value={values.categoryId}
              onChange={onChange}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? <span className={styles.fieldError}>{errors.categoryId}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-brand">
              Brand
            </label>
            <select
              id="product-brand"
              name="brandId"
              className={`${styles.fieldInput} ${errors.brandId ? styles.fieldInputError : ""}`}
              value={values.brandId}
              onChange={onChange}
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId ? <span className={styles.fieldError}>{errors.brandId}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-unit-price">
              Unit Price
            </label>
            <input
              id="product-unit-price"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              className={`${styles.fieldInput} ${errors.unitPrice ? styles.fieldInputError : ""}`}
              value={values.unitPrice}
              onChange={onChange}
            />
            {errors.unitPrice ? <span className={styles.fieldError}>{errors.unitPrice}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-dealer-price">
              Dealer Price
            </label>
            <input
              id="product-dealer-price"
              name="dealerPrice"
              type="number"
              min="0"
              step="0.01"
              className={`${styles.fieldInput} ${errors.dealerPrice ? styles.fieldInputError : ""}`}
              value={values.dealerPrice}
              onChange={onChange}
            />
            {errors.dealerPrice ? <span className={styles.fieldError}>{errors.dealerPrice}</span> : null}
          </div>

          {mode === "create" ? (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="product-stock-quantity">
                Initial Stock
              </label>
              <input
                id="product-stock-quantity"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                className={`${styles.fieldInput} ${errors.stockQuantity ? styles.fieldInputError : ""}`}
                value={values.stockQuantity}
                onChange={onChange}
              />
              {errors.stockQuantity ? <span className={styles.fieldError}>{errors.stockQuantity}</span> : null}
            </div>
          ) : null}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-minimum-stock">
              Minimum Stock
            </label>
            <input
              id="product-minimum-stock"
              name="minimumStock"
              type="number"
              min="0"
              step="1"
              className={`${styles.fieldInput} ${errors.minimumStock ? styles.fieldInputError : ""}`}
              value={values.minimumStock}
              onChange={onChange}
            />
            {errors.minimumStock ? <span className={styles.fieldError}>{errors.minimumStock}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="product-status">
              Status
            </label>
            <select
              id="product-status"
              name="status"
              className={`${styles.fieldInput} ${errors.status ? styles.fieldInputError : ""}`}
              value={values.status}
              onChange={onChange}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.status ? <span className={styles.fieldError}>{errors.status}</span> : null}
          </div>

          <ProductImageUploader
            previewUrl={imagePreviewUrl}
            disabled={!canManage || submitting || imageUploading}
            isUploading={imageUploading}
            error={errors.image}
            hasExistingImage={hasExistingImage}
            onFileSelect={onImageSelect}
            onRemove={onImageRemove}
          />

          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="product-description">
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              className={`${styles.fieldInput} ${styles.textArea} ${errors.description ? styles.fieldInputError : ""}`}
              value={values.description}
              onChange={onChange}
              rows={5}
              placeholder="Product description"
            />
            {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting || imageUploading || !canManage}>
              {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
