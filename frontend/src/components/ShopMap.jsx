import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Star, Navigation, ArrowRight } from 'lucide-react';

const ShopMap = ({ shops, selectedShop, onSelectShop, onRequestDirections, routeGeoJson }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapboxToken) {
      console.error('Mapbox token missing from environment variables.');
      return;
    }
    mapboxgl.accessToken = mapboxToken;

    if (map.current) return; // initialize map only once

    // Default center (e.g., Hyderabad, India / central hub)
    const defaultCenter = [78.4867, 17.3850];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: defaultCenter,
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    map.current.on('load', () => {
      // Add source for directions route
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f97316',
          'line-width': 5,
          'line-opacity': 0.85
        }
      });
    });
  }, [mapboxToken]);

  // Handle route geometry updates
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const routeSource = map.current.getSource('route');
    if (routeSource) {
      if (routeGeoJson) {
        routeSource.setData(routeGeoJson);
        // Fit bounds to route
        const coordinates = routeGeoJson.geometry.coordinates;
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
          map.current.fitBounds(bounds, { padding: 80 });
        }
      } else {
        routeSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        });
      }
    }
  }, [routeGeoJson]);

  // Render markers whenever shops update
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!shops || shops.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    shops.forEach(shop => {
      if (!shop.location || !shop.location.coordinates) return;
      const [lng, lat] = shop.location.coordinates;
      bounds.extend([lng, lat]);

      // Custom HTML Marker element
      const el = document.createElement('div');
      el.className = 'custom-map-marker';
      el.innerHTML = `
        <div class="marker-pin">
          <span class="marker-icon">☕</span>
        </div>
        <div class="marker-label">${shop.name}</div>
      `;

      const popupNode = document.createElement('div');
      popupNode.className = 'map-popup-inner';
      popupNode.innerHTML = `
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

      // Attach click events after popup mounts
      const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupNode);

      popup.on('open', () => {
        const detailsBtn = document.getElementById(`popup-details-${shop._id}`);
        const directionsBtn = document.getElementById(`popup-directions-${shop._id}`);

        if (detailsBtn) {
          detailsBtn.onclick = () => onSelectShop(shop);
        }
        if (directionsBtn) {
          directionsBtn.onclick = () => onRequestDirections(shop);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    if (shops.length > 0 && !routeGeoJson) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [shops, onSelectShop, onRequestDirections, routeGeoJson]);

  // Fly to selected shop when chosen from list
  useEffect(() => {
    if (map.current && selectedShop && selectedShop.location) {
      const [lng, lat] = selectedShop.location.coordinates;
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        essential: true
      });
    }
  }, [selectedShop]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="mapbox-container" />
      {!mapboxToken && (
        <div className="map-error-overlay">
          <p>⚠️ Mapbox token missing in environment configuration.</p>
        </div>
      )}
    </div>
  );
};

export default ShopMap;
