// Map initialization script
function initializeMapWithData(listingData) {
    const hasCoordinates = listingData.coordinates && listingData.coordinates.latitude && listingData.coordinates.longitude;
    const listingLat = listingData.coordinates ? listingData.coordinates.latitude : null;
    const listingLng = listingData.coordinates ? listingData.coordinates.longitude : null;
    const listingLocation = listingData.location;
    const listingCountry = listingData.country;
    
    console.log('Listing data:', listingData);
    console.log('Has coordinates:', hasCoordinates);
    console.log('Leaflet loaded:', typeof L);
    
    // Initialize map using Leaflet with MapTiler tiles
    const initializeMap = () => {
        try {
            let mapCenter, mapZoom;
            
            if (hasCoordinates && listingLat && listingLng) {
                console.log('Coordinates found:', listingLat, listingLng);
                mapCenter = [listingLat, listingLng];
                mapZoom = 12;
            } else {
                console.log('No coordinates found for listing');
                console.log('Location:', listingLocation, 'Country:', listingCountry);
                mapCenter = [28.6139, 77.2090]; // New Delhi, India as default
                mapZoom = 6;
            }
            
            // Initialize Leaflet map
            const map = L.map('map').setView(mapCenter, mapZoom);
            
            // Add MapTiler tiles
            L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=24ccZnXyNFdEavG8Xmsx', {
                attribution: '© MapTiler © OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);
            
            // Add marker
            const marker = L.marker(mapCenter).addTo(map);
            
            // Add popup
            if (hasCoordinates && listingLat && listingLng) {
                marker.bindPopup(`<div style="text-align: center;"><strong>📍 ${listingLocation}, ${listingCountry}</strong><br><small>Exact location</small></div>`);
            } else {
                marker.bindPopup(`<div style="text-align: center;"><strong>📍 ${listingLocation}, ${listingCountry}</strong><br><small>Exact coordinates not available</small></div>`);
            }
            
            console.log('Map initialized successfully with Leaflet');
            
        } catch (error) {
            console.error('Map initialization error:', error);
            document.getElementById('map').innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #e74c3c; font-size: 18px;">Map failed to load: ' + error.message + '</div>';
        }
    };
    
    // Wait for Leaflet to load, then initialize
    if (typeof L !== 'undefined') {
        initializeMap();
    } else {
        console.error('Leaflet not loaded');
        document.getElementById('map').innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #e74c3c; font-size: 18px;">Leaflet map library failed to load</div>';
    }
}
