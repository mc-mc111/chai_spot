const axios = require('axios');

/**
 * Geocodes an address string to [longitude, latitude] using OpenStreetMap Nominatim API.
 * @param {string} address 
 * @returns {Promise<{ coordinates: [number, number], formattedAddress: string }>}
 */
const geocodeAddress = async (address) => {
  const encodedAddress = encodeURIComponent(address.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'ChaiSpot-OpenSource-App/1.0 (contact@chaispot.app)'
      }
    });
    const data = response.data;

    if (!data || data.length === 0) {
      const error = new Error(`Could not geocode address: "${address}". No matching location found.`);
      error.statusCode = 400;
      throw error;
    }

    const item = data[0];
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const formattedAddress = item.display_name || address;

    return {
      coordinates: [lng, lat],
      formattedAddress
    };
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(err.response?.data?.message || 'Failed to communicate with OpenStreetMap Nominatim geocoding service.');
    error.statusCode = 502;
    throw error;
  }
};

/**
 * Gets driving directions route between start [lng, lat] and end [lng, lat] using Open Source Routing Machine (OSRM).
 */
const getDirections = async (startCoords, endCoords) => {
  const [startLng, startLat] = startCoords;
  const [endLng, endLat] = endCoords;
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await axios.get(url);
    if (!response.data.routes || response.data.routes.length === 0) {
      const error = new Error('No route found between the specified locations.');
      error.statusCode = 404;
      throw error;
    }
    return response.data;
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(err.response?.data?.message || 'Failed to fetch directions from OSRM routing service.');
    error.statusCode = 502;
    throw error;
  }
};

module.exports = {
  geocodeAddress,
  getDirections
};
