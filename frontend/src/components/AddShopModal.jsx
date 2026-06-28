import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, MapPin, Image, FileText, Coffee, MousePointer, Compass } from 'lucide-react';
import { shopAPI } from '../services/api';

const AddShopModal = ({ 
  onClose, 
  onShopAdded, 
  onShowToast,
  isPickingLocation,
  setIsPickingLocation,
  pickedLocation,
  setPickedLocation,
  onShiftToMap
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const autocompleteTimer = useRef(null);

  // Sync address if user picked location on map
  useEffect(() => {
    if (pickedLocation && pickedLocation.addressName) {
      setAddress(pickedLocation.addressName);
      setSelectedSuggestion({
        coords: pickedLocation.coords,
        display_name: pickedLocation.addressName
      });
    }
  }, [pickedLocation]);

  const handleAddressInputChange = (e) => {
    const val = e.target.value;
    setAddress(val);
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
    setAddress(sug.display_name);
    setSelectedSuggestion({
      coords: [sug.lng, sug.lat],
      display_name: sug.display_name
    });
    setSuggestions([]);
  };

  const handleStartPickOnMap = () => {
    setIsPickingLocation(true);
    if (onShiftToMap) {
      onShiftToMap();
    }
    onShowToast('📍 Click anywhere on the map to set the shop street address location!', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError('Shop name and address location are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await shopAPI.createShop({
        name,
        address,
        description,
        photoUrl
      });
      onShowToast('✨ Chai spot added successfully with server-side geocoding!', 'success');
      if (setIsPickingLocation) setIsPickingLocation(false);
      if (setPickedLocation) setPickedLocation(null);
      onShopAdded(res.data);
      onClose();
    } catch (err) {
      console.error('Create shop error:', err);
      const msg = err.response?.data?.message || 'Failed to add shop. Please check the address.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content add-shop-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="header-icon">
            <Coffee size={24} />
          </div>
          <div>
            <h2>Add New Chai Spot</h2>
            <p className="modal-subtitle">Share your favorite spot with the community!</p>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        {isPickingLocation && (
          <div className="map-picking-active-banner">
            <MousePointer size={16} className="pulse-icon" />
            <span>Map pointer active! Click anywhere on the map to capture exact location address.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-shop-form">
          <div className="form-group">
            <label><Coffee size={14} /> Shop Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Irani Chai Cafe & Bakers" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group autocomplete-container">
            <div className="label-with-action">
              <label><MapPin size={14} /> Street Address Location *</label>
              <button 
                type="button" 
                className={`pick-map-inline-btn ${isPickingLocation ? 'active' : ''}`}
                onClick={handleStartPickOnMap}
              >
                <Compass size={13} />
                <span>{isPickingLocation ? 'Pointer Active 📍' : 'Point on Map'}</span>
              </button>
            </div>

            <div className="input-with-icon">
              <input 
                type="text" 
                placeholder="Type location address or click 'Point on Map'..." 
                value={address}
                onChange={handleAddressInputChange}
                required
              />
              {selectedSuggestion && (
                <span className="location-verified-badge" title="Location selected from map/autocomplete">
                  ✓ Verified
                </span>
              )}
            </div>

            {suggestions.length > 0 && (
              <ul className="autocomplete-dropdown">
                {suggestions.map((sug, idx) => (
                  <li key={idx} onClick={() => handleSelectSuggestion(sug)}>
                    <MapPin size={14} className="sug-icon" />
                    <span>{sug.display_name}</span>
                  </li>
                ))}
              </ul>
            )}

            <span className="input-hint">
              📍 Select from autocomplete suggestions, click 'Point on Map', or enter full street address.
            </span>
          </div>

          <div className="form-group">
            <label><FileText size={14} /> Description (Optional)</label>
            <textarea 
              rows={3} 
              placeholder="e.g. Famous for Osmania biscuits and authentic Zafrani Chai."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label><Image size={14} /> Photo URL (Optional)</label>
            <input 
              type="url" 
              placeholder="https://images.unsplash.com/..." 
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <PlusCircle size={18} />
            <span>{loading ? 'Geocoding & Saving...' : 'Save Chai Spot'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddShopModal;
