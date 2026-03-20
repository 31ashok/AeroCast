document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const locationBtn = document.getElementById('location-btn');
    const closePanelBtn = document.getElementById('close-panel');
    
    const infoPanel = document.getElementById('info-panel');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-message');
    const weatherDetailsEl = document.getElementById('weather-details');
    const layerBtns = document.querySelectorAll('.layer-btn');

    // Initialize Leaflet Map
    const map = L.map('map', {
        zoomControl: false, // Custom placement
        worldCopyJump: false,
        maxBounds: [
            [-90, -180],
            [90, 180]
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 2, // Prevent zooming out so far it looks broken
        zoomAnimation: true,
        markerZoomAnimation: true,
        fadeAnimation: true
    }).setView([40.7128, -74.0060], 3); 

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Premium Base Map (CartoDB Dark Matter)
    const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 20,
        noWrap: true, // Prevent continuous world mapping horizontally
        bounds: [
            [-90, -180],
            [90, 180]
        ]
    }).addTo(map);

    // Weather Layer Control
    let currentWeatherLayer = null;
    let locationMarker = null;

    function updateLocationMarker(lat, lng) {
        if (locationMarker) {
            locationMarker.setLatLng([lat, lng]);
        } else {
            // Create a custom, scalable pin using FontAwesome and divIcon
            const customIcon = L.divIcon({
                className: 'custom-map-pin',
                html: '<i class="fa-solid fa-location-dot"></i>',
                iconSize: [30, 42],
                iconAnchor: [15, 40]
            });
            locationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }
    }

    layerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            layerBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const layerType = btn.getAttribute('data-layer');
            
            // Remove existing layer
            if (currentWeatherLayer) {
                map.removeLayer(currentWeatherLayer);
                currentWeatherLayer = null;
            }

            // Add new layer if not 'none'
            if (layerType !== 'none') {
                currentWeatherLayer = L.tileLayer(`/api/tiles/${layerType}/{z}/{x}/{y}`, {
                    opacity: 0.6,
                    maxZoom: 18,
                    maxNativeZoom: 6, // Prevents pixelation/404s at high zoom levels
                    updateWhenIdle: true, // Reduces redundant tile fetches during pans
                    keepBuffer: 2,
                    noWrap: true, // Don't repeat weather layers
                    bounds: [
                        [-90, -180],
                        [90, 180]
                    ],
                    attribution: 'Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
                }).addTo(map);
            }
        });
    });

    // Map Click Event to get weather at coordinates
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        map.panTo([lat, lng], { animate: true, duration: 0.8 });
        updateLocationMarker(lat, lng);
        fetchWeatherByCoords(lat, lng);
    });

    closePanelBtn.addEventListener('click', () => {
        infoPanel.classList.add('hidden');
    });

    // Search by city form submit
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherByCity(city);
            cityInput.blur();
        }
    });

    // Geolocation API functionality
    locationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                map.flyTo([lat, lon], 10, { animate: true, duration: 1.5 });
                fetchWeatherByCoords(lat, lon);
            },
            (err) => {
                let msg = 'Unable to retrieve your location.';
                if (err.code === err.PERMISSION_DENIED) {
                    msg = 'Location access was denied.';
                }
                alert(msg);
            },
            { timeout: 10000 }
        );
    });

    // API Calls
    async function fetchWeatherByCity(city) {
        showLoading();
        infoPanel.classList.remove('hidden');
        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            await handleResponse(response, true);
        } catch (error) {
            console.error('Fetch Error:', error);
            showError('Failed to connect to the server.');
        }
    }

    async function fetchWeatherByCoords(lat, lon) {
        showLoading();
        infoPanel.classList.remove('hidden');
        try {
            const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
            await handleResponse(response, false);
        } catch (error) {
            console.error('Fetch Error:', error);
            showError('Failed to connect to the server.');
        }
    }

    async function handleResponse(response, shouldFlyTo) {
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Oops, something went wrong!');
            return;
        }

        const lat = data.current.coord.lat;
        const lon = data.current.coord.lon;
        updateLocationMarker(lat, lon);

        updateUI(data.current);
        
        if (shouldFlyTo) {
            map.flyTo([lat, lon], 10);
        }
    }

    // UI Updates
    function showLoading() {
        loadingEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        weatherDetailsEl.classList.add('hidden');
    }

    function showError(message) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        weatherDetailsEl.classList.add('hidden');
        errorEl.textContent = message;
    }

    function showDetails() {
        loadingEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        weatherDetailsEl.classList.remove('hidden');
    }

    function updateUI(current) {
        document.getElementById('city-name').textContent = current.name ? `${current.name}, ${current.sys.country || ''}` : 'Unknown Location';
        
        const iconCode = current.weather[0].icon;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        
        document.getElementById('temp').textContent = Math.round(current.main.temp);
        document.getElementById('description').textContent = current.weather[0].description;
        
        document.getElementById('humidity').textContent = current.main.humidity;
        document.getElementById('wind-speed').textContent = current.wind.speed.toFixed(1);
        document.getElementById('feels-like').textContent = Math.round(current.main.feels_like);
        
        showDetails();
    }
});
