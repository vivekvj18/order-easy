import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createOrder } from '../../api/ordersApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { DELIVERY_SLOTS } from '../../utils/constants';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── Leaflet Icon Fix ────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map events handler to select coords on click
const MapEvents = ({ setCoords }) => {
  useMapEvents({
    click(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Map controller to pan view when coords change
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center);
  }, [center, map]);
  return null;
};

const PlaceOrderPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [slot, setSlot]         = useState('SLOT_10_MIN');
  const [address, setAddress]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [coords, setCoords]     = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore center
  const [gpsLoading, setGpsLoading] = useState(false);

  // Trigger HTML5 Geolocation prompt on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          toast.success('Automatically fetched your delivery coordinates! 📍');
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          toast.error('Location access denied. Please click on the map to choose your delivery spot.');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const deliveryFee = totalPrice > 199 ? 0 : 29;
  const grandTotal  = totalPrice + deliveryFee + 5;

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        userId:       user?.id || Math.floor(Math.random() * 10000) + 1,
        userEmail:    user?.email || 'user@example.com',
        items:        items.map((i) => ({
          productId:   i.product.id,
          quantity:    i.quantity,
          price:       i.product.price,
        })),
        deliverySlot:    slot || 'SLOT_10_MIN',
        deliveryAddress: address.trim(),
        totalAmount:     grandTotal,
        deliveryLatitude: coords.lat,
        deliveryLongitude: coords.lng,
      };
      const res = await createOrder(payload);
      clearCart();
      toast.success('Order placed successfully! 🎉');
      const orderId = res.data?.id || res.data?.orderId;
      navigate(orderId ? `/orders/${orderId}` : '/orders');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-3xl">
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-green mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </button>

      <h1 className="page-title">Place Order</h1>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left — address + slot */}
        <div className="md:col-span-3 flex flex-col gap-5">
          {/* Delivery address */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-brand-green" />
              <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            </div>
            <textarea
              id="delivery-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Enter your full delivery address…"
              className="form-input resize-none"
            />
          </div>

          {/* Interactive Delivery Coordinates Map */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-green animate-pulse" />
                <h2 className="font-semibold text-gray-900">Pin Location on Map</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    setGpsLoading(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        toast.success('Updated to your current location!');
                        setGpsLoading(false);
                      },
                      () => {
                        toast.error('Location permission denied.');
                        setGpsLoading(false);
                      }
                    );
                  }
                }}
                className="text-xs text-brand-green hover:underline flex items-center gap-1 font-semibold"
              >
                {gpsLoading ? 'Locating...' : 'Recenter to GPS'}
              </button>
            </div>
            
            <div className="h-60 rounded-xl overflow-hidden border border-gray-100 shadow-inner relative z-10">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={[coords.lat, coords.lng]} />
                <MapEvents setCoords={setCoords} />
                <Marker
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const position = e.target.getLatLng();
                      setCoords({ lat: position.lat, lng: position.lng });
                    }
                  }}
                  position={[coords.lat, coords.lng]}
                  icon={destinationIcon}
                />
              </MapContainer>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>Lat: {coords.lat.toFixed(5)}</span>
              <span>Lng: {coords.lng.toFixed(5)}</span>
              <span className="text-gray-500 font-sans italic">Drag marker or click map to move</span>
            </div>
          </div>

          {/* Delivery slot */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-brand-green" />
              <h2 className="font-semibold text-gray-900">Choose Delivery Slot</h2>
            </div>
            <div className="flex flex-col gap-3">
              {DELIVERY_SLOTS.map((s) => (
                <label
                  key={s.value}
                  htmlFor={`slot-${s.value}`}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    slot === s.value
                      ? 'border-brand-green bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    id={`slot-${s.value}`}
                    type="radio"
                    name="slot"
                    value={s.value}
                    checked={slot === s.value}
                    onChange={() => setSlot(s.value)}
                    className="accent-brand-green"
                  />
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  {slot === s.value && (
                    <CheckCircle className="w-4 h-4 text-brand-green ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right — summary */}
        <div className="md:col-span-2">
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.product.id} className="flex justify-between text-sm text-gray-600">
                  <span className="truncate mr-2">
                    {i.product.name} ×{i.quantity}
                  </span>
                  <span className="font-medium text-gray-800 flex-shrink-0">
                    {formatCurrency(i.product.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span className="font-medium">₹5.00</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-brand-green">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-primary w-full py-3 mt-5"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderPage;
