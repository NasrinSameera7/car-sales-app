import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const FUEL_TYPES = ["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"];

export default function PostCar() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    year: "", make: "", variant: "", color: "", fuelType: "PETROL",
    insuranceDetails: "", kmRun: "", owners: "1", price: "", description: "",
  });
  const [photos, setPhotos] = useState([]); // { file, previewUrl }
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onPickPhotos(e) {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - photos.length;
    const next = files.slice(0, remaining).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next]);
    e.target.value = "";
  }

  function removePhoto(idx) {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.year || !form.variant || !form.color || !form.fuelType || !form.insuranceDetails || form.kmRun === "" || form.owners === "") {
      setError("Please fill in year, variant, color, fuel type, insurance details, km run, and number of owners.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      photos.forEach((p) => fd.append("photos", p.file));

      const data = await api.postForm("/api/cars", fd);
      navigate(`/cars/${data.car.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Post your car</h2>
      </div>
      <form className="form-card" onSubmit={onSubmit} style={{ maxWidth: 620 }}>
        {error && <div className="error-banner">{error}</div>}

        <p style={{ fontSize: 13, color: "var(--color-steel)", marginBottom: 18 }}>
          We don't publish phone numbers on listings — interested buyers will message you
          through your PlateSwap inbox to keep your number private.
        </p>

        <div className="field-row">
          <div className="field">
            <label htmlFor="year">Year *</label>
            <input id="year" type="number" min="1980" max={new Date().getFullYear() + 1} required value={form.year} onChange={(e) => update("year", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="make">Make</label>
            <input id="make" placeholder="e.g. Maruti Suzuki" value={form.make} onChange={(e) => update("make", e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="variant">Variant *</label>
            <input id="variant" placeholder="e.g. Swift VXI" required value={form.variant} onChange={(e) => update("variant", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="color">Color *</label>
            <input id="color" required value={form.color} onChange={(e) => update("color", e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="fuelType">Fuel type *</label>
            <select id="fuelType" required value={form.fuelType} onChange={(e) => update("fuelType", e.target.value)}>
              {FUEL_TYPES.map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="owners">Number of owners *</label>
            <input id="owners" type="number" min="1" required value={form.owners} onChange={(e) => update("owners", e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="kmRun">Km's run *</label>
            <input id="kmRun" type="number" min="0" required value={form.kmRun} onChange={(e) => update("kmRun", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="price">Asking price (₹)</label>
            <input id="price" type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="insuranceDetails">Insurance details *</label>
          <input id="insuranceDetails" placeholder="e.g. Comprehensive, valid till Mar 2027" required value={form.insuranceDetails} onChange={(e) => update("insuranceDetails", e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Anything else buyers should know" />
        </div>

        <div className="field">
          <label>Photos</label>
          <div className="photo-upload-grid">
            {photos.map((p, idx) => (
              <div className="photo-thumb" key={idx}>
                <img src={p.previewUrl} alt={`Car photo ${idx + 1}`} />
                <button type="button" onClick={() => removePhoto(idx)} aria-label="Remove photo">✕</button>
              </div>
            ))}
            {photos.length < 10 && (
              <label className="photo-upload-add">
                +
                <input type="file" accept="image/png, image/jpeg, image/webp" multiple hidden onChange={onPickPhotos} />
              </label>
            )}
          </div>
        </div>

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
