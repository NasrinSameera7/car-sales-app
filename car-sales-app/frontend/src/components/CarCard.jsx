import { Link } from "react-router-dom";
import { api } from "../api";

export default function CarCard({ car, wishlisted, onToggleWishlist, showStatus = true }) {
  const cover = car.photos && car.photos[0] ? api.fileUrl(car.photos[0].url) : null;

  return (
    <div className="car-card">
      <div
        className="car-card-photo"
        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
      >
        {showStatus && (
          <span className={`status-pill ${car.status === "SOLD" ? "sold" : "available"}`}>
            {car.status === "SOLD" ? "Sold" : "Available"}
          </span>
        )}
        {onToggleWishlist && (
          <button
            type="button"
            className={`wishlist-btn ${wishlisted ? "active" : ""}`}
            onClick={(e) => { e.preventDefault(); onToggleWishlist(car); }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        )}
      </div>
      <div className="car-card-body">
        <Link to={`/cars/${car.id}`}>
          <h3 className="car-card-title">{car.year} {car.make} {car.variant}</h3>
        </Link>
        <p className="car-card-meta">{car.color} · {car.fuelType.replace("_", " ")} · {car.owners} owner{car.owners > 1 ? "s" : ""}</p>
        <span className="odometer">{car.kmRun.toLocaleString("en-IN")} <span className="unit">KM</span></span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <span className="price-tag">{car.price ? `₹${car.price.toLocaleString("en-IN")}` : "Price on request"}</span>
          <span style={{ fontSize: 12, color: "var(--color-steel)" }}>{car.seller?.name}</span>
        </div>
      </div>
    </div>
  );
}
