import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Compass, X, AlertCircle, Clock, Route, MousePointer } from 'lucide-react';
import { shopAPI } from '../services/api';

const DirectionsPanel = ({ 
  targetShop, 
  shops, 
  onClose, 
  onRouteCalculated, 
  onShowToast,
  isPickingLocation,
  setIsPickingLocation,
  pickedLocation,
  setPickedLocation
}) => {
  const [selectedDestination, setSelectedDestination] = useState(targetShop || (shops.length > 0 ? shops[0] : null));
  const [startType, setStartType] = useState('gps'); // 'gps', 'manual', or 'map'
  const [manualAddress, setManualAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  const autocompleteTimer = useRef(null);

  useEffect(() => {
    if (targetShop) {
      setSelectedDestination(targetShop);
    }
  }, [targetShop]);

  useEffect(() => {
    if (pickedLocation && startType === 'map') {
      setSelectedSuggestion({
        coords: pickedLocation.coords,
        display_name: pickedLocation.addressName
      });
    }
  }, [pickedLocation, startType]);

  const handleAddressInputChange = (e) => {
    const val = e.target.value;
    setManualAddress(val);
    setSelectedSuggestion(null);

    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);

    if (val.trim().length >= 2) {
      autocompleteTimer.current = setTimeout(async () => {
        try {
          const res = await shopAPI.getAutocomplete(val);
          setSuggestions(res.data || []);
        } catch (err) {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (sug) => {
    setManualAddress(sug.display_name);
    setSelectedSuggestion({
      coords: [sug.lng, sug.lat],
      display_name: sug.display_name
    });
    setSuggestions([]);
  };

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
            reject(new Error('Geolocation is not supported by your browser. Please select Enter Address or Pick on Map.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
            (err) => reject(new Error('GPS location permission denied or timed out. Please select Enter Address or Pick on Map.')),
            { timeout: 8000 }
          );
        });
      } else if (startType === 'map') {
        if (!pickedLocation || !pickedLocation.coords) {
          throw new Error('Please click anywhere on the map to set your starting location.');
        }
        startCoords = pickedLocation.coords;
      } else { // manual address
        if (selectedSuggestion && selectedSuggestion.coords) {
          startCoords = selectedSuggestion.coords;
        } else if (manualAddress.trim()) {
          const geocodeRes = await shopAPI.geocodeStart(manualAddress);
          startCoords = geocodeRes.data.coordinates;
        } else {
          throw new Error('Please select an address from the autocomplete suggestions or enter a location.');
        }
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
      const msg = err.response?.data?.message || err.message || 'Failed to fetch directions.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onRouteCalculated(null);
    setIsPickingLocation(false);
    setPickedLocation(null);
    onClose();
  };

  return (
    <div className="directions-panel">
      <div className="panel-header">
        <div className="header-title">
          <Navigation size={20} className="nav-icon" />
          <h3>Get Directions</h3>
        </div>
        <button className="side-panel-close-btn" onClick={handleClear} title="Close Panel">
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
              onClick={() => {
                setStartType('gps');
                setIsPickingLocation(false);
              }}
            >
              My GPS Location
            </button>
            <button
              type="button"
              className={`tab-btn ${startType === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setStartType('manual');
                setIsPickingLocation(false);
              }}
            >
              Enter Address
            </button>
            <button
              type="button"
              className={`tab-btn ${startType === 'map' ? 'active' : ''}`}
              onClick={() => {
                setStartType('map');
                setIsPickingLocation(true);
              }}
            >
              <MousePointer size={12} />
              <span>Pick on Map</span>
            </button>
          </div>

          {startType === 'manual' && (
            <div className="autocomplete-wrapper">
              <input 
                type="text" 
                className="panel-input"
                placeholder="Type location (e.g. Benz Circle, Patamata)..." 
                value={manualAddress}
                onChange={handleAddressInputChange}
                required
              />
              {suggestions.length > 0 && (
                <ul className="autocomplete-dropdown">
                  {suggestions.map((sug, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => handleSelectSuggestion(sug)}
                      className="autocomplete-item"
                    >
                      <MapPin size={14} />
                      <span>{sug.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {startType === 'map' && (
            <div className="map-pick-status">
              {pickedLocation ? (
                <p className="pick-success">📍 {pickedLocation.addressName}</p>
              ) : (
                <p className="pick-instruction">Click anywhere on the map to set start point</p>
              )}
            </div>
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
