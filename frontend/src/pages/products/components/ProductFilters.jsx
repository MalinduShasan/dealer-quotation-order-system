import styles from "../ProductManagement.module.css";

export default function ProductFilters({
  searchValue,
  statusFilter,
  categoryFilter,
  brandFilter,
  lowStockOnly,
  sortBy,
  sortOrder,
  categories,
  brands,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onBrandChange,
  onLowStockChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
  canManage,
  onAddProduct
}) {
  return (
    <div className={styles.filtersToolbar}>
      <div className={styles.filtersMain}>
        <div className={styles.filterGrid}>
          <div className={`${styles.inlineField} ${styles.searchField}`}>
            <label htmlFor="product-search">Search</label>
            <input
              id="product-search"
              className={styles.fieldInput}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search SKU, name, description"
            />
          </div>

          <div className={styles.inlineField}>
            <label htmlFor="product-status-filter">Status</label>
            <select id="product-status-filter" value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="out_of_stock">out of stock</option>
            </select>
          </div>

          <div className={styles.inlineField}>
            <label htmlFor="product-category-filter">Category</label>
            <select id="product-category-filter" value={categoryFilter} onChange={(event) => onCategoryChange(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inlineField}>
            <label htmlFor="product-brand-filter">Brand</label>
            <select id="product-brand-filter" value={brandFilter} onChange={(event) => onBrandChange(event.target.value)}>
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inlineField}>
            <label htmlFor="product-sort-by">Sort By</label>
            <select id="product-sort-by" value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="unit_price">Unit Price</option>
              <option value="dealer_price">Dealer Price</option>
              <option value="stock_quantity">Stock</option>
            </select>
          </div>

          <div className={styles.inlineField}>
            <label htmlFor="product-sort-order">Sort Order</label>
            <select id="product-sort-order" value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className={`${styles.inlineField} ${styles.checkboxField}`}>
            <label className={styles.checkboxLabel} htmlFor="product-low-stock-only">
              <input
                id="product-low-stock-only"
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => onLowStockChange(event.target.checked)}
              />
              Low stock only
            </label>
          </div>
        </div>
      </div>

      <div className={styles.filtersActions}>
        <button type="button" className={styles.secondaryButton} onClick={onReset}>
          Reset Filters
        </button>
        {canManage ? (
          <button type="button" className={styles.primaryButton} onClick={onAddProduct}>
            Add Product
          </button>
        ) : null}
      </div>
    </div>
  );
}
