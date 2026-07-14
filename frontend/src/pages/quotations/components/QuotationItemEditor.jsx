import QuotationItemRow from "./QuotationItemRow";
import QuotationProductSearch from "./QuotationProductSearch";
import styles from "./QuotationBuilder.module.css";

export default function QuotationItemEditor({
  items,
  filteredProducts,
  productSearch,
  onProductSearchChange,
  onAddProduct,
  onUpdateItem,
  onRemoveItem,
  selectedDealer,
  mode = "full"
}) {
  const showSearch = mode !== "queue";
  const showQueue = mode !== "search";

  return (
    <section className={styles.sectionCard}>
      <div>
        <p className={styles.eyebrow}>{showSearch && !showQueue ? "Product Catalog" : "Line Items"}</p>
        <h2 className={styles.sectionTitle}>
          {showSearch && !showQueue ? "Add Products to Quotation" : showQueue && !showSearch ? "Selected Product Queue" : "Quotation Item Editor"}
        </h2>
      </div>

      {showSearch ? (
        <QuotationProductSearch
          products={filteredProducts}
          searchValue={productSearch}
          onSearchChange={onProductSearchChange}
          onAdd={onAddProduct}
          selectedDealer={selectedDealer}
        />
      ) : null}

      {showQueue ? (
        <div className={styles.itemsList}>
          {items.length === 0 ? (
            <div className={styles.emptyText}>
              No products in the queue yet. Click a product on the left to add it here.
            </div>
          ) : (
            items.map((item, index) => (
              <QuotationItemRow
                key={`${item.product_id}-${index}`}
                item={item}
                index={index}
                onChange={onUpdateItem}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
