import styles from "./QuotationBuilder.module.css";

export default function DealerSelector({ dealers, selectedDealer, searchValue, onSearchChange, onSelect }) {
  return (
    <section className={styles.sectionCard}>
      <div>
        <p className={styles.eyebrow}>Dealer</p>
        <h2 className={styles.sectionTitle}>Dealer Selector</h2>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.fieldInput}
          placeholder="Search dealer code, company, contact, or email"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        {selectedDealer ? (
          <div className={styles.selectorCard}>
            <div className={styles.selectorCardHeader}>
              <strong>{selectedDealer.companyName}</strong>
              <span className={styles.badge}>{selectedDealer.dealerCode || "Dealer"}</span>
            </div>
            <p className={styles.subtleText}>
              {selectedDealer.contactPerson} • {selectedDealer.email || "No email"} • {selectedDealer.phone || "No phone"}
            </p>
            <p className={styles.subtleText}>
              {selectedDealer.address || "No address"} {selectedDealer.city ? `• ${selectedDealer.city}` : ""}
            </p>
            <p className={styles.fieldHint}>Payment terms: {selectedDealer.paymentTerms || "Not specified"}</p>
          </div>
        ) : null}

        <div className={styles.searchResults}>
          {dealers.map((dealer) => (
            <button
              key={dealer.id}
              type="button"
              className={`${styles.productResult} ${selectedDealer?.id === dealer.id ? styles.selectedResult : ""}`}
              onClick={() => onSelect(dealer)}
              aria-pressed={selectedDealer?.id === dealer.id}
            >
              <div className={styles.productResultHeader}>
                <strong>{dealer.companyName}</strong>
                <div className={styles.resultMetaGroup}>
                  {selectedDealer?.id === dealer.id ? (
                    <span className={styles.selectedBadge}>Selected</span>
                  ) : null}
                  <span className={styles.badge}>{dealer.dealerCode || "Dealer"}</span>
                </div>
              </div>
              <span className={styles.subtleText}>
                {dealer.contactPerson} • {dealer.email || "No email"} • {dealer.city || "No city"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
