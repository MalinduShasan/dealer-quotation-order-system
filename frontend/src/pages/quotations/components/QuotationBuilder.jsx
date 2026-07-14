import { useMemo, useState } from "react";
import styles from "./QuotationBuilder.module.css";
import DealerSelector from "./DealerSelector";
import QuotationInfoForm from "./QuotationInfoForm";
import QuotationItemEditor from "./QuotationItemEditor";
import QuotationSummary from "./QuotationSummary";
import QuotationNotes from "./QuotationNotes";
import QuotationTerms from "./QuotationTerms";
import QuotationBuilderActions from "./QuotationBuilderActions";

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function buildItem(product) {
  return {
    product_id: product.id,
    product_name_snapshot: product.name,
    product_sku_snapshot: product.sku,
    product_description_snapshot: product.description || "",
    brand_name_snapshot: product.brandName || "",
    category_name_snapshot: product.categoryName || "",
    stockQuantity: Number(product.stockQuantity || 0),
    quantity: "1",
    unit_price: String(product.dealerPrice ?? product.unitPrice ?? 0),
    discount_amount: "0",
    tax_amount: "0",
    line_total: Number(product.dealerPrice ?? product.unitPrice ?? 0)
  };
}

function deriveLineTotal(item) {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unit_price || 0);
  const discountAmount = Number(item.discount_amount || 0);
  const taxAmount = Number(item.tax_amount || 0);
  return roundCurrency(quantity * unitPrice - discountAmount + taxAmount);
}

function calculateTotals(values, items) {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)
  );
  const discountPercentage = Number(values.discount_percentage || 0);
  const taxPercentage = Number(values.tax_percentage || 0);
  const shippingAmount = roundCurrency(values.shipping_amount || 0);
  const discountAmount = roundCurrency((subtotal * discountPercentage) / 100);
  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = roundCurrency((taxableBase * taxPercentage) / 100);
  const grandTotal = roundCurrency(subtotal - discountAmount + taxAmount + shippingAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    grandTotal
  };
}

function validateBuilder(values, selectedDealer, items) {
  const errors = {};
  if (!selectedDealer?.id) errors.dealer_id = "Select a dealer profile";
  if (!items.length) errors.items = "At least one quotation item is required";
  items.forEach((item, index) => {
    if (Number(item.quantity || 0) <= 0) errors[`item.${index}.quantity`] = "Quantity must be greater than zero";
    if (Number(item.quantity || 0) > Number(item.stockQuantity || 0)) errors[`item.${index}.quantity`] = "Quantity exceeds available stock";
  });
  if (Number(values.discount_percentage || 0) < 0 || Number(values.discount_percentage || 0) > 100) {
    errors.discount_percentage = "Discount percentage must be between 0 and 100";
  }
  if (Number(values.tax_percentage || 0) < 0 || Number(values.tax_percentage || 0) > 100) {
    errors.tax_percentage = "Tax percentage must be between 0 and 100";
  }
  return errors;
}

export default function QuotationBuilder({
  mode,
  dealers,
  products,
  initialValues,
  initialDealer,
  initialItems,
  submitting,
  onCancel,
  onSave,
  onToast
}) {
  const [values, setValues] = useState(initialValues);
  const [selectedDealer, setSelectedDealer] = useState(initialDealer);
  const [dealerSearch, setDealerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState(initialItems);
  const [errors, setErrors] = useState({});

  const filteredDealers = useMemo(() => {
    const term = dealerSearch.trim().toLowerCase();
    if (!term) return dealers.slice(0, 6);
    return dealers
      .filter((dealer) =>
        [dealer.dealerCode, dealer.companyName, dealer.contactPerson, dealer.email]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term))
      )
      .slice(0, 8);
  }, [dealerSearch, dealers]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    const activeProducts = products.filter((product) => product.status !== "inactive");
    if (!term) return activeProducts.slice(0, 8);
    return activeProducts
      .filter((product) =>
        [product.sku, product.name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }, [productSearch, products]);

  const totals = useMemo(() => calculateTotals(values, items), [values, items]);

  const handleValueChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleAddProduct = (product) => {
    if (Number(product.stockQuantity || 0) <= 0) {
      onToast?.("error", "Product unavailable", `${product.name} is out of stock and cannot be added to this quotation.`);
      return;
    }

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.product_id === product.id);
      if (existingIndex >= 0) {
        const existingItem = current[existingIndex];
        const nextQuantity = Number(existingItem.quantity || 0) + 1;

        if (nextQuantity > Number(existingItem.stockQuantity || product.stockQuantity || 0)) {
          onToast?.("error", "Stock limit reached", "Requested quantity exceeds current stock.");
          return current;
        }

        return current.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: String(nextQuantity),
                line_total: deriveLineTotal({ ...item, quantity: String(nextQuantity) })
              }
            : item
        );
      }
      return [...current, buildItem(product)];
    });
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        let nextValue = value;

        if (field === "quantity") {
          const parsedQuantity = Number(value || 0);
          const maxQuantity = Number(item.stockQuantity || 0);

          if (parsedQuantity > maxQuantity) {
            onToast?.("error", "Stock limit reached", "Requested quantity exceeds current stock.");
            nextValue = String(maxQuantity);
          }
        }

        const nextItem = { ...item, [field]: nextValue };
        return { ...nextItem, line_total: deriveLineTotal(nextItem) };
      })
    );
  };

  const handleRemoveItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const persist = async (status) => {
    const validationErrors = validateBuilder({ ...values, status }, selectedDealer, items);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    await onSave({
      ...values,
      status,
      dealer_id: selectedDealer.id,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      shipping_amount: totals.shippingAmount,
      grand_total: totals.grandTotal,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount_amount: Number(item.discount_amount || 0),
        tax_amount: Number(item.tax_amount || 0)
      }))
    });
  };

  return (
    <div className={styles.builderPage}>
      <section className={styles.heroCard}>
        <div>
          <p className={styles.eyebrow}>{mode === "edit" ? "Edit Quotation" : "New Quotation"}</p>
          <h1 className={styles.pageTitle}>
            {mode === "edit" ? "Refine quotation pricing, notes, and workflow details." : "Build a dealer quotation with server-trusted pricing and stock validation."}
          </h1>
          <p className={styles.subtleText}>
            Quotations do not deduct stock. Inventory is checked for availability, then revalidated again before final order conversion.
          </p>
        </div>
        <div className={styles.badge}>
          {selectedDealer?.companyName || "Select dealer to begin"}
        </div>
      </section>

      <div className={styles.builderGrid}>
        <div className={styles.mainColumn}>
          <DealerSelector
            dealers={filteredDealers}
            selectedDealer={selectedDealer}
            searchValue={dealerSearch}
            onSearchChange={setDealerSearch}
            onSelect={(dealer) => {
              setSelectedDealer(dealer);
              setDealerSearch(dealer.companyName || "");
            }}
          />
          {errors.dealer_id ? <span className={styles.fieldError}>{errors.dealer_id}</span> : null}

          <QuotationInfoForm values={values} errors={errors} onChange={handleValueChange} />
          <QuotationItemEditor
            filteredProducts={filteredProducts}
            productSearch={productSearch}
            onProductSearchChange={setProductSearch}
            onAddProduct={handleAddProduct}
            selectedDealer={selectedDealer}
            mode="search"
          />
          <QuotationNotes values={values} onChange={handleValueChange} />
          <QuotationTerms values={values} onChange={handleValueChange} />
        </div>

        <div className={styles.sideColumn}>
          <QuotationItemEditor
            items={items}
            filteredProducts={filteredProducts}
            productSearch={productSearch}
            onProductSearchChange={setProductSearch}
            onAddProduct={handleAddProduct}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            selectedDealer={selectedDealer}
            mode="queue"
          />
          {errors.items ? <span className={styles.fieldError}>{errors.items}</span> : null}
          <QuotationSummary totals={totals} />
          <QuotationBuilderActions
            isEditMode={mode === "edit"}
            submitting={submitting}
            onCancel={onCancel}
            onSaveDraft={() => persist("draft")}
            onSubmitWorkflow={() => persist("approved")}
          />
        </div>
      </div>
    </div>
  );
}
