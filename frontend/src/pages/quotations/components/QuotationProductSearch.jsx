import styles from "./QuotationBuilder.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export default function QuotationProductSearch({ products, searchValue, onSearchChange, onAdd, selectedDealer }) {
  return (
    <div className={styles.searchBar}>
      <input
        className={styles.fieldInput}
        placeholder="Search products by SKU or name"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={styles.searchResults}>
        {products.map((product) => (
          <div key={product.id} className={styles.productResult}>
            <div className={styles.productResultHeader}>
              <strong>{product.name}</strong>
              <button type="button" className={styles.secondaryButton} onClick={() => onAdd(product)}>
                Add
              </button>
            </div>
            <span className={styles.itemMeta}>
              {product.sku} • Dealer {formatCurrency(product.dealerPrice)} • Stock {product.stockQuantity}
            </span>
            <span
              className={
                Number(product.stockQuantity) <= 0
                  ? styles.stockBad
                  : Number(product.stockQuantity) <= Number(product.minimumStock)
                    ? styles.stockWarn
                    : styles.stockGood
              }
            >
              {Number(product.stockQuantity) <= 0
                ? "Out of stock"
                : Number(product.stockQuantity) <= Number(product.minimumStock)
                  ? "Low stock"
                  : "Healthy stock"}
            </span>
          </div>
        ))}
      </div>
      {!selectedDealer ? (
        <p className={styles.fieldHint}>Select a dealer first so the quotation queue is tied to the right dealer profile.</p>
      ) : null}
    </div>
  );
}
