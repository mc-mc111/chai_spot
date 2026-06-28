import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const ShopMap = ({ shops, selectedShop, onSelectShop, onRequestDirections, routeGeoJson }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return; // Initialize map once

    // Default center (Hyderabad, India / central hub) [lat, lng]
    const defaultCenter = [17.3850, 78.4867];

    const map = L.map(mapContainer.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true
    });

    // Open-source dark map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

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

  // Render markers whenever shops update
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!shops || shops.length === 0) return;

    const boundsGroup = [];

    shops.forEach(shop => {
      if (!shop.location || !shop.location.coordinates) return;
      const [lng, lat] = shop.location.coordinates;
      boundsGroup.push([lat, lng]);

      // Custom HTML Marker icon using Leaflet DivIcon
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
          <button id="popup-details-${shop._id}" class="popup-btn primary">View Details</button>
          <button id="popup-directions-${shop._id}" class="popup-btn secondary">Directions ↗</button>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance.current);
      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const detailsBtn = document.getElementById(`popup-details-${shop._id}`);
        const directionsBtn = document.getElementById(`popup-directions-${shop._id}`);

        if (detailsBtn) {
          detailsBtn.onclick = () => onSelectShop(shop);
        }
        if (directionsBtn) {
          directionsBtn.onclick = () => onRequestDirections(shop);
        }
      });

      markersRef.current.push(marker);
    });

    if (boundsGroup.length > 0 && !routeGeoJson) {
      const bounds = L.latLngBounds(boundsGroup);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [shops, onSelectShop, onRequestDirections, routeGeoJson]);

  // Pan to selected shop when chosen from list
  useEffect(() => {
    if (mapInstance.current && selectedShop && selectedShop.location) {
      const [lng, lat] = selectedShop.location.coordinates;
      mapInstance.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [selectedShop]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="mapbox-container" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ShopMap;
