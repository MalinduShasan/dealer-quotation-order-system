import filterStyles from "./InventoryFilters.module.css";

export default function InventoryFilters({
  searchValue,
  categoryFilter,
  brandFilter,
  conditionFilter,
  sortBy,
  sortOrder,
  categories,
  brands,
  onSearchChange,
  onCategoryChange,
  onBrandChange,
  onConditionChange,
  onSortByChange,
  onSortOrderChange,
  onReset
}) {
  return (
    <div className={filterStyles.toolbar}>
      <div className={filterStyles.grid}>
        <div className={filterStyles.field}>
          <label className={filterStyles.label} htmlFor="inventory-search">
            Search
          </label>
          <input
            id="inventory-search"
            className={filterStyles.input}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by product or SKU"
            aria-label="Search inventory by product or SKU"
          />
        </div>

        <div className={filterStyles.field}>
          <label className={filterStyles.label} htmlFor="inventory-category">
            Category
          </label>
          <select id="inventory-category" className={filterStyles.input} value={categoryFilter} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={filterStyles.field}>
          <label className={filterStyles.label} htmlFor="inventory-brand">
            Brand
          </label>
          <select id="inventory-brand" className={filterStyles.input} value={brandFilter} onChange={(event) => onBrandChange(event.target.value)}>
            <option value="all">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className={filterStyles.field}>
          <label className={filterStyles.label} htmlFor="inventory-condition">
            Stock Condition
          </label>
          <select id="inventory-condition" className={filterStyles.input} value={conditionFilter} onChange={(event) => onConditionChange(event.target.value)}>
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className={filterStyles.field}>
          <label className={filterStyles.label} htmlFor="inventory-sort-by">
            Sort By
          </label>
          <select id="inventory-sort-by" className={filterStyles.input} value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
            <option value="updated_at">Last Updated</option>
            <option value="name">Product Name</option>
            <option value="sku">SKU</option>
            <option value="stock_quantity">Current Stock</option>
            <option value="minimum_stock">Minimum Stock</option>
            <option value="unit_price">Unit Price</option>
          </select>
        </div>

        <div className={filterStyles.field}>
          <label className={filterStyles.label} htmlFor="inventory-sort-order">
            Sort Order
          </label>
          <select id="inventory-sort-order" className={filterStyles.input} value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className={filterStyles.actions}>
        <button type="button" className={filterStyles.button} onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
