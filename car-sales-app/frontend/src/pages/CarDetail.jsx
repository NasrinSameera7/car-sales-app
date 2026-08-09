import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function CarDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get(`/api/cars/${id}`)
      .then((data) => setCar(data.car))
      .catch((err) => setError(err.message));
  }, [id]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!user) return navigate("/login", { state: { from: { pathname: `/cars/${id}` } } });
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const data = await api.post("/api/messages/start", { carId: id, text: messageText });
      setSent(true);
      navigate(`/inbox/${data.conversationId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (error) return <div className="error-banner">{error}</div>;
  if (!car) return <p style={{ color: "var(--color-steel)" }}>Loading...</p>;

  const photos = car.photos || [];
  const isOwner = user && user.id === car.seller.id;

  return (
    <div>
      <div className="detail-grid">
        <div>
          <div className="detail-photo-main">
            {photos.length > 0 ? (
              <img src={api.fileUrl(photos[activePhoto].url)} alt={`${car.year} ${car.variant}`} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-steel)" }}>No photos yet</div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="detail-thumb-row">
              {photos.map((p, idx) => (
                <img
                  key={p.id}
                  src={api.fileUrl(p.url)}
                  alt=""
                  className={idx === activePhoto ? "active" : ""}
                  onClick={() => setActivePhoto(idx)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <span className={`status-pill ${car.status === "SOLD" ? "sold" : "available"}`} style={{ position: "static", display: "inline-block", marginBottom: 10 }}>
            {car.status === "SOLD" ? "Sold" : "Available"}
          </span>
          <h2>{car.year} {car.make} {car.variant}</h2>
          <p className="price-tag" style={{ fontSize: 24, display: "block", marginTop: 6 }}>
            {car.price ? `₹${car.price.toLocaleString("en-IN")}` : "Price on request"}
          </p>

          <div className="spec-table">
            <div className="spec-item"><div className="label">Color</div><div className="value">{car.color}</div></div>
            <div className="spec-item"><div className="label">Fuel type</div><div className="value">{car.fuelType.replace("_", " ")}</div></div>
            <div className="spec-item"><div className="label">Km run</div><div className="value">{car.kmRun.toLocaleString("en-IN")} km</div></div>
            <div className="spec-item"><div className="label">Owners</div><div className="value">{car.owners}</div></div>
            <div className="spec-item" style={{ gridColumn: "1 / -1" }}>
              <div className="label">Insurance</div><div className="value" style={{ fontSize: 13 }}>{car.insuranceDetails}</div>
            </div>
          </div>

          {car.description && <p style={{ marginBottom: 18, lineHeight: 1.5 }}>{car.description}</p>}

          <div className="form-card" style={{ padding: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Listed by {car.seller.name} {car.seller.role === "DEALER" && <span className="role-badge" style={{ marginLeft: 6 }}>Dealer</span>}
            </p>
            {car.seller.city && <p style={{ fontSize: 13, color: "var(--color-steel)", marginBottom: 12 }}>{car.seller.city}</p>}

            {isOwner ? (
              <Link to="/my-listings" className="btn btn-secondary btn-block">Manage this listing</Link>
            ) : car.status === "SOLD" ? (
              <button className="btn btn-secondary btn-block" disabled>This car has been sold</button>
            ) : (
              <form onSubmit={sendMessage}>
                <textarea
                  rows={3}
                  placeholder={`Hi, is the ${car.variant} still available?`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-line)", marginBottom: 10 }}
                />
                <button className="btn btn-primary btn-block" disabled={sending}>
                  {sending ? "Sending..." : sent ? "Message sent" : "Message seller"}
                </button>
                <p style={{ fontSize: 12, color: "var(--color-steel)", marginTop: 8 }}>
                  Phone numbers aren't shared on PlateSwap — all conversations happen in your inbox.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
