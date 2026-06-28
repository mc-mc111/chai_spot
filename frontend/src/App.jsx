import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ShopMap from './components/ShopMap';
import ShopList from './components/ShopList';
import ShopModal from './components/ShopModal';
import AddShopModal from './components/AddShopModal';
import DirectionsPanel from './components/DirectionsPanel';
import UserProfile from './components/UserProfile';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { shopAPI } from './services/api';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'list'
  
  // Modals & Panels state
  const [selectedShop, setSelectedShop] = useState(null);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [directionsTarget, setDirectionsTarget] = useState(null);
  
  // Navigation route geometry
  const [routeGeoJson, setRouteGeoJson] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      const res = await shopAPI.getAllShops();
      setShops(res.data);
    } catch (err) {
      console.error('Failed to load shops:', err);
      showToastNotification('Failed to connect to backend server.', 'error');
    } finally {
      setLoadingShops(false);
    }
  };

  const showToastNotification = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleShopAdded = (newShop) => {
    setShops(prev => [newShop, ...prev]);
    setSelectedShop(newShop);
  };

  const handleUpdateShopMetrics = (shopId, metrics) => {
    setShops(prev => prev.map(s => {
      if (s._id === shopId) {
        return {
          ...s,
          averageRating: metrics.average,
          reviewCount: metrics.count
        };
      }
      return s;
    }));
    if (selectedShop && selectedShop._id === shopId) {
      setSelectedShop(prev => ({
        ...prev,
        averageRating: metrics.average,
        reviewCount: metrics.count
      }));
    }
  };

  const handleRequestDirections = (shop) => {
    setDirectionsTarget(shop);
    setActiveTab('map');
  };

  return (
    <div className="app-layout">
      <Navbar 
        onOpenAddShop={() => setShowAddShop(true)}
        onOpenAuth={() => setShowAuth(true)}
        onOpenRewards={() => {
          if (!user) setShowAuth(true);
          else setShowProfile(true);
        }}
        onOpenProfile={() => setShowProfile(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {loadingShops ? (
          <div className="global-loader">
            <div className="spinner">☕</div>
            <p>Brewing your chai spot experience...</p>
          </div>
        ) : (
          <div className="view-container">
            {activeTab === 'map' && (
              <div className="map-view-wrapper">
                <ShopMap 
                  shops={shops} 
                  selectedShop={selectedShop}
                  onSelectShop={(shop) => {
                    setDirectionsTarget(null);
                    setSelectedShop(shop);
                  }}
                  onRequestDirections={handleRequestDirections}
                  routeGeoJson={routeGeoJson}
                />

                {selectedShop && !directionsTarget && (
                  <ShopModal 
                    shop={selectedShop}
                    onClose={() => setSelectedShop(null)}
                    onRequestDirections={(shop) => {
                      setSelectedShop(null);
                      handleRequestDirections(shop);
                    }}
                    onUpdateShopMetrics={handleUpdateShopMetrics}
                    onShowToast={showToastNotification}
                    onOpenAuth={() => setShowAuth(true)}
                  />
                )}

                {directionsTarget && (
                  <DirectionsPanel 
                    targetShop={directionsTarget}
                    shops={shops}
                    onClose={() => setDirectionsTarget(null)}
                    onRouteCalculated={(geoJson) => setRouteGeoJson(geoJson)}
                    onShowToast={showToastNotification}
                  />
                )}
              </div>
            )}

            {activeTab === 'list' && (
              <ShopList 
                shops={shops}
                onSelectShop={(shop) => {
                  setSelectedShop(shop);
                  setActiveTab('map');
                }}
                onRequestDirections={handleRequestDirections}
              />
            )}
          </div>
        )}
      </main>

      {showAddShop && (
        <AddShopModal 
          onClose={() => setShowAddShop(false)}
          onShopAdded={handleShopAdded}
          onShowToast={showToastNotification}
        />
      )}

      {showProfile && (
        <UserProfile 
          shops={shops}
          onClose={() => setShowProfile(false)}
          onShowToast={showToastNotification}
        />
      )}

      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)}
          onShowToast={showToastNotification}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
