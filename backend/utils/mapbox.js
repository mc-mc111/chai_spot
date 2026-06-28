const axios = require('axios');

/**
 * Geocodes an address string to [longitude, latitude] using Mapbox Geocoding API server-side.
 * @param {string} address 
 * @returns {Promise<{ coordinates: [number, number], formattedAddress: string }>}
 */
const geocodeAddress = async (address) => {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MAPBOX_ACCESS_TOKEN environment variable is not set on the server.');
  }

  const encodedAddress = encodeURIComponent(address.trim());
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}&limit=1`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data.features || data.features.length === 0) {
      const error = new Error(`Could not geocode address: "${address}". No matching location found.`);
      error.statusCode = 400;
      throw error;
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;
    const formattedAddress = feature.place_name || address;

    return {
      coordinates: [lng, lat],
      formattedAddress
    };
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(err.response?.data?.message || 'Failed to communicate with Mapbox Geocoding service.');
    error.statusCode = 502;
    throw error;
  }
};

/**
 * Gets driving directions route between start [lng, lat] and end [lng, lat]
 */
const getDirections = async (startCoords, endCoords) => {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MAPBOX_ACCESS_TOKEN environment variable is not set on the server.');
  }

  const [startLng, startLat] = startCoords;
  const [endLng, endLat] = endCoords;
  const url = `https://api.mapbox.com/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&access_token=${token}`;

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
    const error = new Error(err.response?.data?.message || 'Failed to fetch directions from Mapbox.');
    error.statusCode = 502;
    throw error;
  }
};

module.exports = {
  geocodeAddress,
  getDirections
};
