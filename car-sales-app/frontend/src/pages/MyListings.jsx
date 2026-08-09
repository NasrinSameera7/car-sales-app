import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import CarCard from "../components/CarCard";

export default function MyListings() {
  const [tab, setTab] = useState("posted");
  const [posted, setPosted] = useState([]);
  const [sold, setSold] = useState([]);
  const [bought, setBought] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [buyerEmail, setBuyerEmail] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, txData] = await Promise.all([
        api.get("/api/cars/mine/posts"),
        api.get("/api/cars/mine/transactions"),
      ]);
      setPosted(postsData.listings);
      setSold(txData.sold);
      setBought(txData.bought);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteListing(car) {
    if (!confirm(`Remove your listing for the ${car.year} ${car.variant}?`)) return;
    try {
      await api.del(`/api/cars/${car.id}`);
      setPosted((p) => p.filter((c) => c.id !== car.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function markSold(carId) {
    setError("");
    const buyerId = buyerEmail[carId];
    if (!buyerId) {
      setError("Search and select the buyer by their friend/user ID first (see Friends page).");
      return;
    }
    try {
      await api.post(`/api/cars/${carId}/mark-sold`, { buyerId });
      setMarkingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p style={{ color: "var(--color-steel)" }}>Loading your listings...</p>;

  return (
    <div>
      <div className="page-header"><h2>My posts & transactions</h2></div>
      {error && <div className="error-banner">{error}</div>}

      <div className="tab-row">
        <button className={`tab ${tab === "posted" ? "active" : ""}`} onClick={() => setTab("posted")}>Posted ({posted.length})</button>
        <button className={`tab ${tab === "sold" ? "active" : ""}`} onClick={() => setTab("sold")}>Sold ({sold.length})</button>
        <button className={`tab ${tab === "bought" ? "active" : ""}`} onClick={() => setTab("bought")}>Bought ({bought.length})</button>
      </div>

      {tab === "posted" && (
        posted.length === 0 ? (
          <div className="empty-state"><h3>No listings yet</h3><p>Post your first car to get started.</p></div>
        ) : (
          <div className="car-grid">
            {posted.map((car) => (
              <div key={car.id}>
                <CarCard car={car} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {car.status === "AVAILABLE" && (
                    <button className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => setMarkingId(markingId === car.id ? null : car.id)}>
                      Mark as sold
                    </button>
                  )}
                  <button className="btn btn-danger" style={{ flex: 1, fontSize: 12 }} onClick={() => deleteListing(car)}>Remove</button>
                </div>
                {markingId === car.id && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <input
                      placeholder="Buyer's user ID"
                      value={buyerEmail[car.id] || ""}
                      onChange={(e) => setBuyerEmail((m) => ({ ...m, [car.id]: e.target.value }))}
                      style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--color-line)" }}
                    />
                    <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => markSold(car.id)}>Confirm</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "sold" && (
        sold.length === 0 ? (
          <div className="empty-state"><h3>Nothing sold yet</h3></div>
        ) : (
          <div className="car-grid">
            {sold.map((tx) => (
              <div key={tx.id}>
                <CarCard car={tx.car} showStatus={false} />
                <p style={{ fontSize: 13, color: "var(--color-steel)", marginTop: 6 }}>Sold to {tx.buyer.name} on {new Date(tx.soldAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "bought" && (
        bought.length === 0 ? (
          <div className="empty-state"><h3>Nothing bought yet</h3></div>
        ) : (
          <div className="car-grid">
            {bought.map((tx) => (
              <div key={tx.id}>
                <CarCard car={tx.car} showStatus={false} />
                <p style={{ fontSize: 13, color: "var(--color-steel)", marginTop: 6 }}>Bought from {tx.seller.name} on {new Date(tx.soldAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
