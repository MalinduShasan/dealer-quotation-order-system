import ProductCard from "./ProductCard";
import cardStyles from "./ProductCard.module.css";

function ProductGridSkeleton() {
  return (
    <div className={cardStyles.grid}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className={cardStyles.card} aria-hidden="true">
          <div className={cardStyles.imageWrap} />
          <div className={cardStyles.content}>
            <div className={cardStyles.metric} />
            <div className={cardStyles.pricingGrid}>
              <div className={cardStyles.metric} />
              <div className={cardStyles.metric} />
            </div>
            <div className={cardStyles.inventoryGrid}>
              <div className={cardStyles.metric} />
              <div className={cardStyles.metric} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({
  products,
  canManage,
  loading,
  onNavigate,
  onEdit,
  onToggleStatus,
  onImagePreview
}) {
  if (loading) {
    return <ProductGridSkeleton />;
  }

  return (
    <div className={cardStyles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          canManage={canManage}
          onNavigate={onNavigate}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onImagePreview={onImagePreview}
        />
      ))}
    </div>
  );
}
