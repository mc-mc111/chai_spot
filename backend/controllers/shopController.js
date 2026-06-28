const Shop = require('../models/Shop');
const { geocodeAddress, getDirections, autocompleteAddress } = require('../utils/mapbox');

// @desc    Get all chai shops
// @route   GET /api/shops
const getShops = async (req, res) => {
  try {
    const shops = await Shop.find({}).sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Failed to fetch shops.' });
  }
};

// @desc    Get single chai shop by ID
// @route   GET /api/shops/:id
const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Chai shop not found.' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop by ID:', error);
    res.status(500).json({ message: 'Failed to fetch shop details.' });
  }
};

// @desc    Create a new chai shop with server-side geocoding
// @route   POST /api/shops
const createShop = async (req, res) => {
  try {
    const { name, address, description, photoUrl } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: 'Shop name and address are required.' });
    }

    // Server-side Geocoding via Mapbox
    let geocodeResult;
    try {
      geocodeResult = await geocodeAddress(address);
    } catch (geoErr) {
      return res.status(geoErr.statusCode || 400).json({ 
        message: geoErr.message || 'Geocoding failed for the provided address.' 
      });
    }

    const newShop = await Shop.create({
      name,
      address: geocodeResult.formattedAddress || address,
      location: {
        type: 'Point',
        coordinates: geocodeResult.coordinates // [lng, lat]
      },
      description: description || '',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      createdBy: req.user._id
    });

    res.status(201).json(newShop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ message: error.message || 'Server error creating chai shop.' });
  }
};

// @desc    Helper proxy to get directions or geocode start location
// @route   GET /api/shops/directions
const getDirectionsRoute = async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat } = req.query;
    if (!startLng || !startLat || !endLng || !endLat) {
      return res.status(400).json({ message: 'Missing start or end coordinates.' });
    }

    const directionsData = await getDirections(
      [parseFloat(startLng), parseFloat(startLat)],
      [parseFloat(endLng), parseFloat(endLat)]
    );

    res.json(directionsData);
  } catch (error) {
    console.error('Error getting directions:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to calculate route.' });
  }
};

// @desc    Geocode manually entered start location for directions
// @route   GET /api/shops/geocode-start
const geocodeStart = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: 'Address query parameter is required.' });
    }
    const result = await geocodeAddress(address);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message || 'Geocoding failed.' });
  }
};

// @desc    Autocomplete address query for search dropdown
// @route   GET /api/shops/autocomplete
const getAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    const suggestions = await autocompleteAddress(q);
    res.json(suggestions);
  } catch (error) {
    res.json([]);
  }
};

module.exports = {
  getShops,
  getShopById,
  createShop,
  getDirectionsRoute,
  geocodeStart,
  getAutocomplete
};
