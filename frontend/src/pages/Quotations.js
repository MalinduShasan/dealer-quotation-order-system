import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getPendingQuotations } from "../api/api";

function Quotations() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        const { data } = await getPendingQuotations(user.token);
        setQuotations(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load quotations");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      loadQuotations();
    }
  }, [user]);

  return (
    <section className="quotation-layout">
      <div className="page-card hero-panel">
        <p className="eyebrow">Dealer Review Desk</p>
        <h2 className="hero-title">Pending quotations, presented with clarity.</h2>
        <p className="hero-text">
          Review customer requests in a clean, responsive layout designed for fast commercial
          decisions and calm day-to-day operations.
        </p>
        <div className="button-row">
          <button className="lux-button" type="button" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Loading quotation portfolio...</div>}
      {error && <div className="status-banner status-banner--error">{error}</div>}

      {!loading && !error && quotations.length === 0 && (
        <div className="empty-state">No pending quotations found right now.</div>
      )}

      {!loading && !error && quotations.length > 0 && (
        <div className="quotation-list">
          {quotations.map((quotation) => (
            <article key={quotation._id} className="quotation-card">
              <div className="quotation-card__header">
                <div>
                  <p className="mini-label">Customer</p>
                  <h3 className="section-title">{quotation.customer?.name || quotation.customer?.email}</h3>
                  <p className="supporting-text">{quotation.customer?.email}</p>
                </div>
                <span className="pill">{quotation.status}</span>
              </div>

              <div className="meta-grid">
                <div className="info-card">
                  <p className="mini-label">Quotation ID</p>
                  <p className="supporting-text">{quotation._id}</p>
                </div>
                <div className="info-card">
                  <p className="mini-label">Items</p>
                  <p className="supporting-text">{quotation.items?.length || 0} line items</p>
                </div>
                <div className="info-card">
                  <p className="mini-label">Priority</p>
                  <p className="supporting-text">Awaiting dealer decision</p>
                </div>
              </div>

              <div className="line-items">
                {(quotation.items || []).map((item, index) => (
                  <div key={item._id || `${quotation._id}-${index}`} className="line-item">
                    <div>
                      <strong>{item.product?.name || "Product"}</strong>
                      <p className="supporting-text">Unit price: {item.price}</p>
                    </div>
                    <div>
                      <strong>Qty {item.quantity}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="quotation-card__footer">
                <div>
                  <p className="mini-label">Commercial Total</p>
                  <div className="quotation-total">{quotation.totalPrice}</div>
                </div>
                <p className="supporting-text">Approval and rejection actions can be added into this card layout next.</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Quotations;
