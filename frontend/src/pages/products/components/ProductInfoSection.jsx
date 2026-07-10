import styles from "../ProductDetails.module.css";

function InfoItem({ label, value, block = false, children }) {
  return (
    <div className={`${styles.infoItem} ${block ? styles.infoItemWide : ""}`}>
      <span className={styles.infoLabel}>{label}</span>
      {children || <span className={styles.infoValue}>{value || "N/A"}</span>}
    </div>
  );
}

export default function ProductInfoSection({ product, isEditing = false, values, errors, categories = [], brands = [], onChange }) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>General</p>
          <h2 className={styles.sectionTitle}>Product Information</h2>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <InfoItem label="Name" value={product.name}>
          {isEditing ? (
            <>
              <input name="name" className={styles.inlineInput} value={values.name} onChange={onChange} />
              {errors.name ? <span className={styles.inlineError}>{errors.name}</span> : null}
            </>
          ) : null}
        </InfoItem>
        <InfoItem label="SKU" value={product.sku}>
          {isEditing ? (
            <>
              <input name="sku" className={styles.inlineInput} value={values.sku} onChange={onChange} />
              {errors.sku ? <span className={styles.inlineError}>{errors.sku}</span> : null}
            </>
          ) : null}
        </InfoItem>
        <InfoItem label="Brand" value={product.brandName}>
          {isEditing ? (
            <>
              <select name="brandId" className={styles.inlineInput} value={values.brandId} onChange={onChange}>
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brandId ? <span className={styles.inlineError}>{errors.brandId}</span> : null}
            </>
          ) : null}
        </InfoItem>
        <InfoItem label="Category" value={product.categoryName}>
          {isEditing ? (
            <>
              <select name="categoryId" className={styles.inlineInput} value={values.categoryId} onChange={onChange}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId ? <span className={styles.inlineError}>{errors.categoryId}</span> : null}
            </>
          ) : null}
        </InfoItem>
        <InfoItem label="Description" value={product.description || "No description provided."} block>
          {isEditing ? (
            <>
              <textarea
                name="description"
                className={`${styles.inlineInput} ${styles.inlineTextarea}`}
                value={values.description}
                onChange={onChange}
                rows={5}
              />
              {errors.description ? <span className={styles.inlineError}>{errors.description}</span> : null}
            </>
          ) : null}
        </InfoItem>
      </div>
    </section>
  );
}
