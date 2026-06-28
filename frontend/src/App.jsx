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
import NavSimulationHUD from './components/NavSimulationHUD';
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
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);
  
  // Navigation route geometry & Simulation state
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [navSteps, setNavSteps] = useState(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

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
    if (!directionsTarget || directionsTarget._id !== shop._id) {
      setRouteInfo(null);
      setRouteGeoJson(null);
    }
    setDirectionsTarget(shop);
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
                  isPickingLocation={isPickingLocation}
                  pickedLocation={pickedLocation}
                  onLocationPicked={(coords, addressName) => {
                    setPickedLocation({ coords, addressName });
                    setIsPickingLocation(false);
                    showToastNotification('📍 Starting location set from map click!', 'success');
                  }}
                  navSteps={navSteps}
                  currentStepIdx={currentStepIdx}
                />

                {navSteps && (
                  <NavSimulationHUD 
                    steps={navSteps}
                    currentStepIdx={currentStepIdx}
                    onStepChange={(stepIdx) => {
                      if (typeof stepIdx === 'function') {
                        setCurrentStepIdx(stepIdx);
                      } else {
                        setCurrentStepIdx(stepIdx);
                      }
                    }}
                    onClose={() => {
                      setNavSteps(null);
                      setCurrentStepIdx(0);
                    }}
                  />
                )}

                {selectedShop && !directionsTarget && !navSteps && (
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

                {directionsTarget && !navSteps && (
                  <DirectionsPanel 
                    targetShop={directionsTarget}
                    shops={shops}
                    routeInfo={routeInfo}
                    setRouteInfo={setRouteInfo}
                    onClose={() => {
                      setDirectionsTarget(null);
                      setIsPickingLocation(false);
                      setPickedLocation(null);
                      setRouteGeoJson(null);
                      setRouteInfo(null);
                    }}
                    onRouteCalculated={(geoJson) => setRouteGeoJson(geoJson)}
                    onShowToast={showToastNotification}
                    isPickingLocation={isPickingLocation}
                    setIsPickingLocation={setIsPickingLocation}
                    pickedLocation={pickedLocation}
                    setPickedLocation={setPickedLocation}
                    onStartNavSimulation={(steps) => {
                      setNavSteps(steps);
                      setCurrentStepIdx(0);
                      showToastNotification('🏎️ Live turn-by-turn simulation started!', 'info');
                    }}
                  />
                )}
              </div>
            )}

            {activeTab === 'list' && (
              <div className="list-view-wrapper">
                {selectedShop && !directionsTarget && (
                  <div className="list-directions-sidebar">
                    <ShopModal 
                      shop={selectedShop}
                      onClose={() => setSelectedShop(null)}
                      onRequestDirections={(shop) => {
                        handleRequestDirections(shop);
                      }}
                      onUpdateShopMetrics={handleUpdateShopMetrics}
                      onShowToast={showToastNotification}
                      onOpenAuth={() => setShowAuth(true)}
                      onShiftToMap={() => setActiveTab('map')}
                    />
                  </div>
                )}

                {directionsTarget && (
                  <div className="list-directions-sidebar">
                    <DirectionsPanel 
                      targetShop={directionsTarget}
                      shops={shops}
                      routeInfo={routeInfo}
                      setRouteInfo={setRouteInfo}
                      onClose={() => {
                        setDirectionsTarget(null);
                        setIsPickingLocation(false);
                        setPickedLocation(null);
                        setRouteGeoJson(null);
                        setRouteInfo(null);
                      }}
                      onRouteCalculated={(geoJson) => setRouteGeoJson(geoJson)}
                      onShowToast={showToastNotification}
                      isPickingLocation={isPickingLocation}
                      setIsPickingLocation={setIsPickingLocation}
                      pickedLocation={pickedLocation}
                      setPickedLocation={setPickedLocation}
                      onStartNavSimulation={(steps) => {
                        setNavSteps(steps);
                        setCurrentStepIdx(0);
                        setActiveTab('map');
                        showToastNotification('🏎️ Live turn-by-turn simulation started on map!', 'info');
                      }}
                      onShiftToMap={() => setActiveTab('map')}
                    />
                  </div>
                )}

                <ShopList 
                  shops={shops}
                  onSelectShop={(shop) => {
                    setDirectionsTarget(null);
                    setSelectedShop(shop);
                  }}
                  onRequestDirections={(shop) => {
                    setSelectedShop(null);
                    handleRequestDirections(shop);
                  }}
                />
              </div>
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
