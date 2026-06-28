import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const ShopMap = ({ 
  shops, 
  selectedShop, 
  onSelectShop, 
  onRequestDirections, 
  routeGeoJson,
  isPickingLocation,
  pickedLocation,
  onLocationPicked 
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const pickedMarkerRef = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return; // Initialize map once

    const defaultCenter = [16.5062, 80.6480];

    const map = L.map(mapContainer.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstance.current = map;

    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 200);

    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Map Click Listener for picking starting location
  useEffect(() => {
    if (!mapInstance.current) return;

    const handleMapClick = (e) => {
      if (isPickingLocation && onLocationPicked) {
        const { lat, lng } = e.latlng;
        onLocationPicked([lng, lat], `Point on Map (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    };

    mapInstance.current.on('click', handleMapClick);
    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click', handleMapClick);
      }
    };
  }, [isPickingLocation, onLocationPicked]);

  // Handle picked location pin
  useEffect(() => {
    if (!mapInstance.current) return;

    if (pickedMarkerRef.current) {
      pickedMarkerRef.current.remove();
      pickedMarkerRef.current = null;
    }

    if (pickedLocation && pickedLocation.coords) {
      const [lng, lat] = pickedLocation.coords;
      const startIcon = L.divIcon({
        className: 'leaflet-custom-marker',
        html: `
          <div class="custom-map-marker start-pin">
            <div class="marker-pin start">
              <span class="marker-icon">📍</span>
            </div>
            <div class="marker-label start">Starting Point</div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      const marker = L.marker([lat, lng], { icon: startIcon }).addTo(mapInstance.current);
      pickedMarkerRef.current = marker;
    }
  }, [pickedLocation]);

  // Handle route geometry updates
  useEffect(() => {
    if (!mapInstance.current) return;

    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeoJson && routeGeoJson.geometry) {
      const routeLayer = L.geoJSON(routeGeoJson, {
        style: {
          color: '#f97316',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }
      }).addTo(mapInstance.current);

      routeLayerRef.current = routeLayer;

      const bounds = routeLayer.getBounds();
      if (bounds.isValid()) {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [routeGeoJson]);

  // Render shop markers
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!shops || shops.length === 0) return;

    const boundsGroup = [];

    shops.forEach(shop => {
      if (!shop.location || !shop.location.coordinates) return;
      const [lng, lat] = shop.location.coordinates;
      boundsGroup.push([lat, lng]);

      const customIcon = L.divIcon({
        className: 'leaflet-custom-marker',
        html: `
          <div class="custom-map-marker">
            <div class="marker-pin">
              <span class="marker-icon">☕</span>
            </div>
            <div class="marker-label">${shop.name}</div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -45]
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'map-popup-inner';
      popupContent.innerHTML = `
        <h3 class="popup-title">${shop.name}</h3>
        <p class="popup-address">${shop.address}</p>
        <div class="popup-rating">
          <span class="star">★</span> 
          <strong>${shop.averageRating ? shop.averageRating.toFixed(1) : 'New'}</strong>
          <span class="count">(${shop.reviewCount || 0} reviews)</span>
        </div>
        <div class="popup-actions">
          <button class="popup-btn primary">View Details</button>
          <button class="popup-btn secondary">Directions ↗</button>
        </div>
      `;

      const detailsBtn = popupContent.querySelector('.popup-btn.primary');
      const directionsBtn = popupContent.querySelector('.popup-btn.secondary');

      if (detailsBtn) {
        detailsBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectShop(shop);
        };
      }
      if (directionsBtn) {
        directionsBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          onRequestDirections(shop);
        };
      }

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance.current);
      marker.bindPopup(popupContent);

      markersRef.current.push(marker);
    });

    if (boundsGroup.length > 0 && !routeGeoJson && !pickedLocation) {
      const bounds = L.latLngBounds(boundsGroup);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [shops, onSelectShop, onRequestDirections, routeGeoJson, pickedLocation]);

  // Pan to selected shop
  useEffect(() => {
    if (mapInstance.current && selectedShop && selectedShop.location) {
      const [lng, lat] = selectedShop.location.coordinates;
      mapInstance.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [selectedShop]);

  return (
    <div className={`map-wrapper ${isPickingLocation ? 'picking-mode' : ''}`}>
      <div ref={mapContainer} className="mapbox-container" />
      {isPickingLocation && (
        <div className="map-picking-banner">
          <span>🎯 Click anywhere on the map to set starting point</span>
        </div>
      )}
    </div>
  );
};

export default ShopMap;
