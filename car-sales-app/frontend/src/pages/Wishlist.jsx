import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import CarCard from "../components/CarCard";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.get("/api/wishlist");
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(car) {
    try {
      await api.del(`/api/wishlist/${car.id}`);
      setItems((i) => i.filter((it) => it.car.id !== car.id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p style={{ color: "var(--color-steel)" }}>Loading your wishlist...</p>;

  return (
    <div>
      <div className="page-header"><h2>My wishlist</h2></div>
      {error && <div className="error-banner">{error}</div>}
      {items.length === 0 ? (
        <div className="empty-state"><h3>Your wishlist is empty</h3><p>Tap the heart on any car to save it here.</p></div>
      ) : (
        <div className="car-grid">
          {items.map((item) => (
            <CarCard key={item.car.id} car={item.car} wishlisted onToggleWishlist={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
