const axios = require('axios');

/**
 * Geocode a location string to get latitude and longitude coordinates
 * @param {string} location - The location string (e.g., "New York City")
 * @param {string} country - The country string (e.g., "United States")
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
const geocodeLocation = async (location, country = '') => {
    try {
        // Combine location and country for better results
        const query = country ? `${location}, ${country}` : location;
        
        // Use OpenStreetMap Nominatim API (free, no API key needed)
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'Wanderlust-Travel-App' // Required by Nominatim
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error.message);
        return null;
    }
};

module.exports = { geocodeLocation };
