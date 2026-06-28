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
  onLocationPicked,
  navSteps,
  currentStepIdx
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const pickedMarkerRef = useRef(null);
  const routeStartMarkerRef = useRef(null);
  const routeEndMarkerRef = useRef(null);
  const simCarMarkerRef = useRef(null);

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

    const handleMapClick = async (e) => {
      if (isPickingLocation && onLocationPicked) {
        const { lat, lng } = e.latlng;
        // Immediate fallback coordinate label
        onLocationPicked([lng, lat], `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            onLocationPicked([lng, lat], data.display_name);
          }
        } catch (err) {
          console.warn('Reverse geocode fetch failed:', err);
        }
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
            <div class="marker-label start">Start Location</div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      const marker = L.marker([lat, lng], { icon: startIcon, zIndexOffset: 1000 }).addTo(mapInstance.current);
      pickedMarkerRef.current = marker;
    }
  }, [pickedLocation]);

  // Handle route geometry & start/end route markers (Item 2 fix)
  useEffect(() => {
    if (!mapInstance.current) return;

    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (routeStartMarkerRef.current) {
      routeStartMarkerRef.current.remove();
      routeStartMarkerRef.current = null;
    }
    if (routeEndMarkerRef.current) {
      routeEndMarkerRef.current.remove();
      routeEndMarkerRef.current = null;
    }

    if (routeGeoJson && routeGeoJson.geometry && routeGeoJson.geometry.coordinates) {
      const coords = routeGeoJson.geometry.coordinates; // [[lng, lat], ...]
      
      const routeLayer = L.geoJSON(routeGeoJson, {
        style: {
          color: '#f97316',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }
      }).addTo(mapInstance.current);

      routeLayerRef.current = routeLayer;

      if (coords.length > 0) {
        const [startLng, startLat] = coords[0];
        const [endLng, endLat] = coords[coords.length - 1];

        // Start route marker
        const startIcon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="custom-map-marker start-pin">
              <div class="marker-pin start">
                <span class="marker-icon">🚀</span>
              </div>
              <div class="marker-label start">Start Point</div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });
        routeStartMarkerRef.current = L.marker([startLat, startLng], { icon: startIcon, zIndexOffset: 1000 }).addTo(mapInstance.current);

        // End route marker
        const endIcon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="custom-map-marker end-pin">
              <div class="marker-pin end">
                <span class="marker-icon">🎯</span>
              </div>
              <div class="marker-label end">Destination</div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });
        routeEndMarkerRef.current = L.marker([endLat, endLng], { icon: endIcon, zIndexOffset: 1000 }).addTo(mapInstance.current);
      }

      const bounds = routeLayer.getBounds();
      if (bounds.isValid() && navSteps === null) {
        mapInstance.current.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [routeGeoJson, navSteps]);

  // Handle simulation driver car movement (Item 3)
  useEffect(() => {
    if (!mapInstance.current) return;

    if (simCarMarkerRef.current) {
      simCarMarkerRef.current.remove();
      simCarMarkerRef.current = null;
    }

    if (navSteps && navSteps.length > 0 && currentStepIdx >= 0) {
      const step = navSteps[currentStepIdx];
      if (step && step.maneuver && step.maneuver.location) {
        const [lng, lat] = step.maneuver.location;

        const carIcon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="custom-map-marker car-sim-pin">
              <div class="marker-pin car">
                <span class="marker-icon">🏎️</span>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([lat, lng], { icon: carIcon, zIndexOffset: 2000 }).addTo(mapInstance.current);
        simCarMarkerRef.current = marker;

        mapInstance.current.flyTo([lat, lng], 17, { duration: 1.0 });
      }
    }
  }, [navSteps, currentStepIdx]);

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

    if (boundsGroup.length > 0 && !routeGeoJson && !pickedLocation && !navSteps) {
      const bounds = L.latLngBounds(boundsGroup);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [shops, onSelectShop, onRequestDirections, routeGeoJson, pickedLocation, navSteps]);

  // Pan to selected shop
  useEffect(() => {
    if (mapInstance.current && selectedShop && selectedShop.location && !navSteps) {
      const [lng, lat] = selectedShop.location.coordinates;
      mapInstance.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [selectedShop, navSteps]);

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
