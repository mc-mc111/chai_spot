import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Compass, X, AlertCircle, Clock, Route } from 'lucide-react';
import { shopAPI } from '../services/api';

const DirectionsPanel = ({ targetShop, shops, onClose, onRouteCalculated, onShowToast }) => {
  const [selectedDestination, setSelectedDestination] = useState(targetShop || (shops.length > 0 ? shops[0] : null));
  const [startType, setStartType] = useState('gps'); // 'gps' or 'manual'
  const [manualAddress, setManualAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (targetShop) {
      setSelectedDestination(targetShop);
    }
  }, [targetShop]);

  const handleCalculateRoute = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDestination || !selectedDestination.location) {
      setError('Please select a destination chai spot.');
      return;
    }

    setLoading(true);
    setError('');
    setRouteInfo(null);

    const [endLng, endLat] = selectedDestination.location.coordinates;

    try {
      let startCoords = null;

      if (startType === 'gps') {
        startCoords = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Browser geolocation is not supported by your browser. Please select manual address.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
            (err) => reject(new Error('Geolocation failed or denied. Please enter a manual starting location.')),
            { timeout: 8000 }
          );
        });
      } else {
        if (!manualAddress.trim()) {
          throw new Error('Please enter a valid starting address.');
        }
        const geocodeRes = await shopAPI.geocodeStart(manualAddress);
        startCoords = geocodeRes.data.coordinates;
      }

      const directionsRes = await shopAPI.getDirections(startCoords[0], startCoords[1], endLng, endLat);
      const data = directionsRes.data;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteInfo({
          distanceKm: (route.distance / 1000).toFixed(1),
          durationMins: Math.round(route.duration / 60),
          steps: route.legs[0]?.steps || []
        });
        onRouteCalculated({
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        });
        onShowToast('🗺️ Route calculated successfully!', 'success');
      }
    } catch (err) {
      console.error('Directions error:', err);
      const msg = err.message || err.response?.data?.message || 'Failed to fetch directions.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onRouteCalculated(null);
    onClose();
  };

  return (
    <div className="directions-panel">
      <div className="panel-header">
        <div className="header-title">
          <Navigation size={20} className="nav-icon" />
          <h3>Get Directions</h3>
        </div>
        <button className="panel-close" onClick={handleClear}>
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="panel-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCalculateRoute} className="directions-form">
        <div className="form-field">
          <label><Compass size={14} /> Starting Point</label>
          <div className="start-type-tabs">
            <button
              type="button"
              className={`tab-btn ${startType === 'gps' ? 'active' : ''}`}
              onClick={() => setStartType('gps')}
            >
              My GPS Location
            </button>
            <button
              type="button"
              className={`tab-btn ${startType === 'manual' ? 'active' : ''}`}
              onClick={() => setStartType('manual')}
            >
              Enter Address
            </button>
          </div>

          {startType === 'manual' && (
            <input 
              type="text" 
              className="panel-input"
              placeholder="e.g. Hitech City, Hyderabad" 
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              required
            />
          )}
        </div>

        <div className="form-field">
          <label><MapPin size={14} /> Destination Spot</label>
          <select 
            className="panel-select"
            value={selectedDestination?._id || ''}
            onChange={(e) => {
              const s = shops.find(item => item._id === e.target.value);
              setSelectedDestination(s);
            }}
          >
            {shops.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.address})</option>
            ))}
          </select>
        </div>

        <button type="submit" className="find-route-btn" disabled={loading}>
          <Navigation size={16} />
          <span>{loading ? 'Calculating Route...' : 'Find Driving Route'}</span>
        </button>
      </form>

      {routeInfo && (
        <div className="route-results">
          <div className="route-summary-cards">
            <div className="summary-card">
              <Route size={18} />
              <div>
                <span className="card-val">{routeInfo.distanceKm} km</span>
                <span className="card-lbl">Distance</span>
              </div>
            </div>
            <div className="summary-card">
              <Clock size={18} />
              <div>
                <span className="card-val">{routeInfo.durationMins} mins</span>
                <span className="card-lbl">Est. Time</span>
              </div>
            </div>
          </div>

          {routeInfo.steps.length > 0 && (
            <div className="turn-instructions">
              <h4>Step-by-Step Directions</h4>
              <ol>
                {routeInfo.steps.map((step, idx) => {
                  const type = step.maneuver?.type || 'drive';
                  const modifier = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
                  const street = step.name ? ` onto ${step.name}` : '';
                  let text = `${type.charAt(0).toUpperCase() + type.slice(1)}${modifier}${street}`;
                  if (type === 'depart') text = `Head out${modifier}${street}`;
                  if (type === 'arrive') text = `Arrive at destination`;

                  return (
                    <li key={idx} className="step-item">
                      <span className="step-text">{text}</span>
                      <span className="step-dist">({(step.distance / 1000).toFixed(1)} km)</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectionsPanel;
