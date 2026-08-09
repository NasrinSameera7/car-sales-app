import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import CarCard from "../components/CarCard";

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [listings, setListings] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ fuelType: "", minYear: "", maxYear: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (filters.fuelType) params.set("fuelType", filters.fuelType);
      if (filters.minYear) params.set("minYear", filters.minYear);
      if (filters.maxYear) params.set("maxYear", filters.maxYear);

      const data = await api.get(`/api/cars?${params.toString()}`);
      setListings(data.listings);

      if (user) {
        const w = await api.get("/api/wishlist");
        setWishlistIds(new Set(w.items.map((i) => i.car.id)));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [q, filters, user]);

  useEffect(() => { load(); }, [load]);

  async function toggleWishlist(car) {
    if (!user) return;
    try {
      if (wishlistIds.has(car.id)) {
        await api.del(`/api/wishlist/${car.id}`);
        setWishlistIds((prev) => { const next = new Set(prev); next.delete(car.id); return next; });
      } else {
        await api.post(`/api/wishlist/${car.id}`);
        setWishlistIds((prev) => new Set(prev).add(car.id));
      }
    } catch (err) {
      // ignore — non-critical UI action
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{q ? `Results for "${q}"` : "Latest cars from dealers & customers"}</h2>
          <p style={{ color: "var(--color-steel)", marginTop: 4 }}>
            {user ? "Newest listings, picked for you" : "Sign up to save cars and message sellers directly"}
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filters.fuelType} onChange={(e) => setFilters((f) => ({ ...f, fuelType: e.target.value }))}>
          <option value="">All fuel types</option>
          <option value="PETROL">Petrol</option>
          <option value="DIESEL">Diesel</option>
          <option value="ELECTRIC">Electric</option>
          <option value="HYBRID">Hybrid</option>
          <option value="CNG">CNG</option>
        </select>
        <input type="number" placeholder="Min year" value={filters.minYear} onChange={(e) => setFilters((f) => ({ ...f, minYear: e.target.value }))} style={{ width: 100 }} />
        <input type="number" placeholder="Max year" value={filters.maxYear} onChange={(e) => setFilters((f) => ({ ...f, maxYear: e.target.value }))} style={{ width: 100 }} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--color-steel)" }}>Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <h3>No cars match yet</h3>
          <p>Try a different search, or check back soon as new listings get posted.</p>
        </div>
      ) : (
        <div className="car-grid">
          {listings.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              wishlisted={wishlistIds.has(car.id)}
              onToggleWishlist={user ? toggleWishlist : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
