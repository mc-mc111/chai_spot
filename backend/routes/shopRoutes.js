const express = require('express');
const router = express.Router();
const { getShops, getShopById, createShop, getDirectionsRoute, geocodeStart, getAutocomplete } = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getShops);
router.get('/directions', getDirectionsRoute);
router.get('/geocode-start', geocodeStart);
router.get('/autocomplete', getAutocomplete);
router.get('/:id', getShopById);
router.post('/', protect, createShop);

module.exports = router;
