import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, CheckCircle } from 'lucide-react';
import { updateTracking } from '../../api/trackingApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const UpdateLocationPage = () => {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    orderId:   searchParams.get('orderId') || '',
    latitude:  '',
    longitude: '',
    address:   '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Location fetched!');
      },
      () => toast.error('Could not get your location')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.latitude || !form.longitude) {
      toast.error('Order ID, latitude and longitude are required');
      return;
    }
    setLoading(true);
    try {
      await updateTracking({
        orderId:   form.orderId,
        latitude:  parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        address:   form.address,
      });
      setSuccess(true);
      toast.success('Location updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-xl">
      <h1 className="page-title">Update Location</h1>
      <p className="text-gray-500 text-sm mb-6">
        Submit your current GPS coordinates for the active order.
      </p>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Order ID */}
          <div className="form-group">
            <label className="form-label">Order ID *</label>
            <input
              type="text"
              name="orderId"
              value={form.orderId}
              onChange={handleChange}
              placeholder="Enter order ID"
              className="form-input"
              id="location-order-id"
            />
          </div>

          {/* Auto-fetch */}
          <button
            type="button"
            onClick={handleGetLocation}
            className="btn-secondary w-full"
            id="get-location-btn"
          >
            <Navigation className="w-4 h-4" />
            Auto-detect My Location
          </button>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Latitude *</label>
              <input
                type="number"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 28.6139"
                step="any"
                className="form-input"
                id="location-latitude"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude *</label>
              <input
                type="number"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 77.2090"
                step="any"
                className="form-input"
                id="location-longitude"
              />
            </div>
          </div>

          {/* Current address */}
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-green" />
              Current Address (optional)
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Near Connaught Place, New Delhi"
              className="form-input resize-none"
              id="location-address"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full py-3 ${success ? 'bg-green-500' : ''}`}
            id="submit-location-btn"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : success ? (
              <><CheckCircle className="w-4 h-4" /> Location Sent!</>
            ) : (
              'Submit Location'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateLocationPage;
