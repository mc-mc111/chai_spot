import React, { useState } from 'react';
import { Star, MapPin, Navigation, MessageSquare, Search } from 'lucide-react';

const ShopList = ({ shops, onSelectShop, onRequestDirections }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.description && shop.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="shop-list-container">
      <div className="shop-list-header">
        <h2>Chai Spots Discovery</h2>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by spot name, city or location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="shop-cards-grid">
        {filteredShops.length === 0 ? (
          <div className="empty-state">
            <p>☕ No chai spots found matching "{searchTerm}".</p>
          </div>
        ) : (
          filteredShops.map(shop => (
            <div key={shop._id} className="shop-card">
              <div className="shop-card-image" style={{ backgroundImage: `url(${shop.photoUrl})` }}>
                <div className="shop-rating-tag">
                  <Star size={14} className="star-filled" />
                  <span>{shop.averageRating ? shop.averageRating.toFixed(1) : 'New'}</span>
                </div>
              </div>

              <div className="shop-card-content">
                <h3 className="shop-name">{shop.name}</h3>
                <p className="shop-address">
                  <MapPin size={14} />
                  <span>{shop.address}</span>
                </p>

                {shop.description && (
                  <p className="shop-desc">{shop.description}</p>
                )}

                <div className="shop-card-footer">
                  <span className="review-count">
                    <MessageSquare size={14} />
                    {shop.reviewCount || 0} reviews
                  </span>

                  <div className="card-actions">
                    <button 
                      className="card-action-btn secondary"
                      onClick={() => onRequestDirections(shop)}
                      title="Get Directions"
                    >
                      <Navigation size={16} />
                      <span>Directions</span>
                    </button>

                    <button 
                      className="card-action-btn primary"
                      onClick={() => onSelectShop(shop)}
                    >
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShopList;
