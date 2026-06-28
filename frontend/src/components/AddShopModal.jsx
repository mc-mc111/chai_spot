import React, { useState } from 'react';
import { X, PlusCircle, MapPin, Image, FileText, Coffee } from 'lucide-react';
import { shopAPI } from '../services/api';

const AddShopModal = ({ onClose, onShopAdded, onShowToast }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError('Shop name and address are required.');
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

          <div className="form-group">
            <label><MapPin size={14} /> Street Address / Location *</label>
            <input 
              type="text" 
              placeholder="e.g. Charminar, Old City, Hyderabad, Telangana" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <span className="input-hint">📍 Coordinates will be automatically calculated server-side via Mapbox Geocoding.</span>
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
