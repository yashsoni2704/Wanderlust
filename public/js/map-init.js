// Map initialization script
function initializeMapWithData(listingData) {
    const hasCoordinates = listingData.coordinates && listingData.coordinates.latitude && listingData.coordinates.longitude;
    const listingLat = listingData.coordinates ? listingData.coordinates.latitude : null;
    const listingLng = listingData.coordinates ? listingData.coordinates.longitude : null;
    const listingLocation = listingData.location;
    const listingCountry = listingData.country;
    const listingTitle = listingData.title;
    
    // Minimal logging for cleaner UI
    
    // Initialize map using Leaflet with OpenStreetMap tiles
    const initializeMap = () => {
        try {
            let mapCenter, mapZoom;
            
            if (hasCoordinates && listingLat && listingLng) {
                mapCenter = [listingLat, listingLng];
                mapZoom = 13;
            } else {
                // Default to center of India
                mapCenter = [20.5937, 78.9629];
                mapZoom = 5;
            }
            
            // Initialize Leaflet map
            const map = L.map('map', {
                center: mapCenter,
                zoom: mapZoom,
                zoomControl: true
            });
            
            // Add OpenStreetMap tiles (free, no API key needed)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            
            // Helpers to build marker HTML
            const createHomeIconHTML = () => (
                '<div style="background-color: #2b2b2b; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 18px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">'
                + '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
                + '<path d="M3 11.5L12 4l9 7.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                + '<path d="M5.5 10.5V20h13v-9.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                + '<path d="M10 20v-5h4v5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                + '</svg>'
                + '</div>'
            );

            // Airbnb Bélo logo as inline SVG, wrapped to match pin-shape background
            const createAirbnbIconHTML = () => (
                '<div style="background-color: #fe424d; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 18px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">'
                + '<svg width="22" height="22" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
                + '<path fill="#ffffff" d="M128.1 205.2c-9.8 0-19.6-3.9-27.1-11.7c-7.4-7.8-10.7-18.6-9.1-29.3c1.6-10.4 7.6-19.8 16.6-25.6l19.5-12.6l19.5 12.6c9 5.8 15 15.2 16.6 25.6c1.7 10.7-1.6 21.5-9.1 29.3c-7.5 7.8-17.3 11.7-27.1 11.7m0-128.4c-9.7-18.6-21.2-38.6-33.8-58.7c-4.9-7.7-12.9-12.1-22-12.1C57.4 6 44 19.3 44 35.9c0 6.1 1.7 12 4.8 17.1c17.3 29.4 40.8 67.1 60.9 99.9c5.4 8.8 12.8 13.6 22.4 13.6s17-4.7 22.4-13.6c20.1-32.8 43.6-70.5 60.9-99.9c3.1-5.1 4.8-11 4.8-17.1C220.1 19.3 206.8 6 189.9 6c-9.1 0-17.1 4.4-22 12.1c-12.6 20.1-24.1 40.1-33.8 58.7"/>'
                + '</svg>'
                + '</div>'
            );

            // Create default (home) custom icon
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: createHomeIconHTML(),
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });
            
            // Add marker with custom icon
            const marker = L.marker(mapCenter, { icon: customIcon }).addTo(map);

            // Tooltip on hover only; text depends on accuracy
            const tooltipText = (hasCoordinates && listingLat && listingLng)
                ? 'Exact location provided after booking'
                : 'Approximate location provided';
            marker.bindTooltip(tooltipText, {
                permanent: false,
                direction: 'top',
                className: 'marker-tooltip'
            });

            // Swap icon on hover: home -> Airbnb logo, and show tooltip
            marker.on('mouseover', () => {
                marker.setIcon(L.divIcon({
                    className: 'custom-marker',
                    html: createAirbnbIconHTML(),
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                }));
                marker.openTooltip();
            });

            marker.on('mouseout', () => {
                marker.setIcon(L.divIcon({
                    className: 'custom-marker',
                    html: createHomeIconHTML(),
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                }));
                marker.closeTooltip();
            });
            
            // Premium-style soft highlight circle around the location
            if (hasCoordinates && listingLat && listingLng) {
                L.circle(mapCenter, {
                    color: '#fe424d',
                    fillColor: '#fe424d',
                    fillOpacity: 0.15,
                    radius: 400,
                    weight: 0
                }).addTo(map);
            }

            // Popup on click
            const popupContent = `
                <div style="text-align: center; padding: 5px;">
                    <strong style="color: #fe424d; font-size: 16px;">${listingTitle}</strong><br>
                    <span style="font-size: 14px;">${listingLocation}, ${listingCountry}</span>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            // Map initialized
            
        } catch (error) {
            console.error('Map initialization error:', error);
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; background-color: #f8f9fa;">
                        <p style="color: #e74c3c; font-size: 18px; margin: 0;">🗺️ Map failed to load</p>
                        <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">${error.message}</p>
                    </div>
                `;
            }
        }
    };
    
    // Wait for Leaflet to load, then initialize
    if (typeof L !== 'undefined') {
        initializeMap();
    } else {
        console.error('Leaflet not loaded');
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
            mapDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; background-color: #f8f9fa;">
                    <p style="color: #e74c3c; font-size: 18px; margin: 0;">🗺️ Map failed to load</p>
                    <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">Leaflet map library failed to load</p>
                </div>
            `;
        }
    }
}
