import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, RefreshCw, Navigation, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { getLatestTracking, getTrackingHistory } from '../../api/trackingApi';
import { getOrderById } from '../../api/ordersApi';
import { getDeliveryByOrderId } from '../../api/deliveryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime, extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

// ─── Leaflet Icon Fix ────────────────────────────────────────────────────────
// This is required because Vite/Webpack messes up the paths to Leaflet's default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for Rider and Destination
const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ─── Map Controller ──────────────────────────────────────────────────────────
// Helper component to auto-recenter the map when coordinates change
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center);
  }, [center, map]);
  return null;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const BANGALORE_COORDS = [12.9716, 77.5946];

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder]       = useState(null);
  const [latest, setLatest]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [autoRefresh, setAuto]  = useState(true);

  // ─── Fetch Order Details (Once) ─────────────────────────────────────────────
  const fetchOrderDetails = useCallback(async () => {
    try {
      const res = await getOrderById(orderId);
      setOrder(res.data?.data || res.data);
    } catch (err) {
      toast.error('Could not fetch order details');
      navigate('/orders');
    }
  }, [orderId, navigate]);

  // ─── Fetch Tracking Data (Polling) ──────────────────────────────────────────
  const fetchTracking = useCallback(async () => {
    try {
      const [latRes, histRes, delivRes] = await Promise.allSettled([
        getLatestTracking(orderId),
        getTrackingHistory(orderId),
        getDeliveryByOrderId(orderId),
      ]);

      if (latRes.status === 'fulfilled') {
        const data = latRes.value.data;
        if (data && data.latitude) setLatest(data);
      }

      if (histRes.status === 'fulfilled') {
        const h = histRes.value.data;
        const historyData = Array.isArray(h) ? h : [];
        setHistory(historyData);
      }

      if (delivRes.status === 'fulfilled') {
        const d = delivRes.value.data;
        if (d) setDelivery(d);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial load
  useEffect(() => {
    fetchOrderDetails();
    fetchTracking();
  }, [fetchOrderDetails, fetchTracking]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || (order && order.status === 'DELIVERED')) return;

    const interval = setInterval(fetchTracking, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTracking, order]);

  // ─── Map Logic ──────────────────────────────────────────────────────────────
  // Center Priority: Rider -> Destination -> Bangalore
  const riderCoords = latest ? [latest.latitude, latest.longitude] : null;
  const destCoords = (order?.deliveryLatitude && order?.deliveryLongitude) 
    ? [order.deliveryLatitude, order.deliveryLongitude] 
    : null;

  const mapCenter = riderCoords || destCoords || BANGALORE_COORDS;
  const polylinePoints = history.map(h => [h.latitude, h.longitude]);

  // Add latest point to polyline if not already there
  if (latest && (polylinePoints.length === 0 || 
      polylinePoints[polylinePoints.length-1][0] !== latest.latitude)) {
    polylinePoints.push([latest.latitude, latest.longitude]);
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-green mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Order
          </button>
          <h1 className="page-title mb-0 text-2xl">Track Order #{orderId}</h1>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer px-2">
            <input
              type="checkbox"
              checked={autoRefresh && order?.status !== 'DELIVERED'}
              disabled={order?.status === 'DELIVERED'}
              onChange={(e) => setAuto(e.target.checked)}
              className="accent-brand-green w-4 h-4 rounded"
            />
            <span className={order?.status === 'DELIVERED' ? 'opacity-50' : ''}>Auto-refresh</span>
          </label>
          <div className="w-px h-4 bg-gray-200" />
          <button
            onClick={() => { setLoading(true); fetchTracking(); }}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-brand-green"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map & Status */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Map Container */}
          <div className="card overflow-hidden border-0 shadow-xl relative" style={{ height: '420px' }}>
            {loading && !latest && (
              <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
            
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '380px', width: '100%', borderRadius: '12px' }}
              zoomControl={false}
              className="z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapController center={mapCenter} />

              {/* Rider Marker */}
              {riderCoords && (
                <Marker position={riderCoords} icon={riderIcon}>
                  <Popup>
                    <div className="text-sm font-medium">
                      <p className="text-brand-green font-bold">Delivery Partner</p>
                      <p className="text-xs text-gray-500 mt-1">Last updated: {formatDateTime(latest.timestamp)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination Marker */}
              {destCoords && (
                <Marker position={destCoords} icon={destinationIcon}>
                  <Popup>
                    <div className="text-sm font-medium text-red-600">Your Delivery Location</div>
                  </Popup>
                </Marker>
              )}

              {/* Path Polyline */}
              {polylinePoints.length > 1 && (
                <Polyline 
                  positions={polylinePoints} 
                  color="#22c55e" 
                  weight={4} 
                  opacity={0.7}
                  dashArray="5, 10"
                />
              )}
            </MapContainer>

            {/* Map Overlay Info */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2">
              <div className="flex-1 bg-white/90 backdrop-blur shadow-lg border border-white p-3 rounded-xl flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${order?.status === 'DELIVERED' ? 'bg-green-500' : 'bg-brand-green animate-pulse'}`} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Current Status</p>
                  <p className="text-sm font-bold text-gray-900">{order?.status?.replace(/_/g, ' ') || 'UPDATING...'}</p>
                </div>
              </div>
              {latest && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${latest.latitude},${latest.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/90 backdrop-blur shadow-lg border border-white p-3 rounded-xl flex items-center gap-3 hover:bg-white transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Google Maps</p>
                    <p className="text-sm font-bold text-gray-900">Open Live View</p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="card p-4 bg-white border-0 shadow-sm">
              <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-tight">Rider & Delivery ID</p>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  <p className="font-bold text-gray-800">
                    {delivery?.partnerName || 'Assigning Rider...'}
                  </p>
                </div>
                {delivery?.partnerPhone && (
                  <p className="text-xs text-gray-500 ml-6">
                    Call: <span className="font-semibold text-gray-700">{delivery.partnerPhone}</span>
                  </p>
                )}
                {delivery?.deliveryId && (
                  <p className="text-[10px] text-gray-400 ml-6 font-mono font-semibold uppercase tracking-wide">
                    Deliv ID: #{delivery.deliveryId}
                  </p>
                )}
              </div>
            </div>
            <div className="card p-4 bg-white border-0 shadow-sm">
              <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-tight">Distance</p>
              <p className="font-bold text-gray-800">Calculating...</p>
            </div>
            <div className="card p-4 bg-white border-0 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-tight">ETA</p>
              <p className="font-bold text-brand-green">~ 8-12 mins</p>
            </div>
          </div>
        </div>

        {/* Right Column: History List */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 h-full border-0 shadow-lg bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-green" /> Live Timeline
              </h2>
              <span className="px-2 py-1 bg-primary-50 text-brand-green text-[10px] font-bold rounded-lg uppercase">
                {history.length} Checkpoints
              </span>
            </div>

            {history.length > 0 ? (
              <div className="flex flex-col gap-0">
                {history.slice(0, 8).map((h, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0 z-10 ${idx === 0 ? 'bg-brand-green ring-4 ring-green-100' : 'bg-gray-300'}`} />
                      {idx < Math.min(history.length, 8) - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-100 group-hover:bg-green-50 transition-colors" />
                      )}
                    </div>
                    <div className="pb-6 pt-0.5">
                      <p className={`text-sm font-medium ${idx === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                        {h.address || `Coordinate: ${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wide">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {history.length > 8 && (
                  <p className="text-center text-xs text-gray-400 italic py-2">
                    + {history.length - 8} more historical points
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Navigation className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-500">Awaiting GPS signal...</p>
                <p className="text-xs text-gray-400 mt-1">Timeline updates as the rider moves</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
