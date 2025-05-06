const apiKey = "a9bd344737e10da594a9baad29940aff"; // replaced broken apiKey with functioning apiKey
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const geoApiUrl = 'https://api.openweathermap.org/geo/1.0/direct';
const timeDisplay = document.getElementById('timeDisplay');
const timeToggle = document.getElementById('timeToggle');

let isFahrenheit = true;

// Add an event listener to the input field to fetch suggestions
locationInput.addEventListener('input', () => {
    const query = locationInput.value.trim();
    if (query.length > 2) { // Fetch suggestions only if input length > 2
        fetchCitySuggestions(query);
    }
});

const maxStoredSearches = 5; // Limit the number of stored searches

searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        saveSearch(location); // Save the search to localStorage
        fetchWeather(location);
    }
});

const tempToggle = document.getElementById('tempToggle');

tempToggle.addEventListener('click', () => {
    isFahrenheit = !isFahrenheit; // Toggle the unit
    updateTemperatures(); // Update all temperature displays

    // Update the button text
    tempToggle.textContent = isFahrenheit ? 'Switch to Celsius' : 'Switch to Fahrenheit';
});

function updateTemperatures() {
    // Update the main temperature
    const temp = isFahrenheit
        ? `${temperatureElement.dataset.fahrenheit}°F`
        : `${temperatureElement.dataset.celsius}°C`;
    temperatureElement.textContent = temp;

    // Update the "feels like" temperature
    const feelsLike = isFahrenheit
        ? `${document.getElementById('feelsLike').dataset.fahrenheit}°F`
        : `${document.getElementById('feelsLike').dataset.celsius}°C`;
    document.getElementById('feelsLike').textContent = feelsLike;
}

function fetchWeather(location) {
    const url = `${apiUrl}?q=${location}&appid=${apiKey}&units=imperial`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Weather Condition:', data.weather[0].main); // Debugging log

            locationElement.textContent = `${data.name}, ${data.sys.country}`;
            const tempFahrenheit = Math.round(data.main.temp);
            const tempCelsius = Math.round((data.main.temp - 32) * (5 / 9));
            temperatureElement.dataset.fahrenheit = tempFahrenheit;
            temperatureElement.dataset.celsius = tempCelsius;
            temperatureElement.textContent = `${tempFahrenheit}°F`;

            descriptionElement.textContent = data.weather[0].description;

            // Update additional fields
            document.getElementById('humidity').textContent = `${data.main.humidity}%`;
            document.getElementById('wind').textContent = `${data.wind.speed} mph`;
            document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
            document.getElementById('visibility').textContent = `${(data.visibility / 1609).toFixed(1)} mi`;

            document.getElementById('feelsLike').dataset.fahrenheit = Math.round(data.main.feels_like);
            document.getElementById('feelsLike').dataset.celsius = Math.round((data.main.feels_like - 32) * (5 / 9));
            document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°F`;

            // Sunrise and Sunset
            const sunriseUTC = new Date(data.sys.sunrise * 1000);
            const sunsetUTC = new Date(data.sys.sunset * 1000);

            // Store UTC times in dataset
            document.getElementById('sunrise').dataset.utc = data.sys.sunrise;
            document.getElementById('sunset').dataset.utc = data.sys.sunset;

            const locationTimeOffset = data.timezone; // Offset in seconds
            timeToggle.dataset.offset = locationTimeOffset; // Store the offset in the toggle

            updateSunTimes(sunriseUTC, sunsetUTC, locationTimeOffset, true);
            updateTimeDisplay(locationTimeOffset);

            // Call updateBackground with the correct parameters
            updateBackground(data.weather[0].main, sunriseUTC, sunsetUTC, locationTimeOffset);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
}

function updateTimeDisplay(locationTimeOffset) {
    const isLocalTime = timeToggle.dataset.localTime === 'true';
    
    // Get current time as UTC
    const nowUTC = new Date(); 
    
    if (isLocalTime) {
        // Get the local time for the searched city
        const cityNowUTC = new Date(nowUTC.getTime() + locationTimeOffset * 1000)
        timeDisplay.textContent = `Local Time: ${cityNowUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        // Display the user's current system time
        timeDisplay.textContent = `Your Time: ${nowUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

function updateSunTimes(sunriseUTC, sunsetUTC, locationTimeOffset, isLocalTime) {
    const sunriseElement = document.getElementById('sunrise');
    const sunsetElement = document.getElementById('sunset');

    if (isLocalTime) {
        // Calculate local time for the searched location
        const sunriseLocal = new Date(sunriseUTC.getTime() + locationTimeOffset * 1000);
        const sunsetLocal = new Date(sunsetUTC.getTime() + locationTimeOffset * 1000);

        sunriseElement.textContent = sunriseLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunsetElement.textContent = sunsetLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        // Display sunrise and sunset in the user's current time zone
        sunriseElement.textContent = sunriseUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunsetElement.textContent = sunsetUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function fetchCitySuggestions(query) {
    const url = `${geoApiUrl}?q=${query}&limit=5&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const datalist = document.getElementById('citySuggestions');
            datalist.innerHTML = ''; // Clear previous suggestions

            data.forEach(city => {
                const option = document.createElement('option');
                const state = city.state ? `, ${city.state}` : ''; // Include state if available
                option.value = `${city.name}${state}`;
                datalist.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching city suggestions:', error);
        });
}

timeToggle.addEventListener('click', () => {
    const isLocalTime = timeToggle.dataset.localTime === 'true'; // Check current state
    const locationTimeOffset = parseInt(timeToggle.dataset.offset || 0, 10); // Get the offset
    const sunriseUTC = new Date(document.getElementById('sunrise').dataset.utc * 1000); // Retrieve stored UTC time
    const sunsetUTC = new Date(document.getElementById('sunset').dataset.utc * 1000); // Retrieve stored UTC time

    // Toggle the time display
    updateSunTimes(sunriseUTC, sunsetUTC, locationTimeOffset, !isLocalTime);

    // Update the button text and state
    timeToggle.textContent = isLocalTime ? 'Switch to Local Time' : 'Switch to Your Time';
    timeToggle.dataset.localTime = (!isLocalTime).toString();
});

function generateSnow() {
    const weatherEffect = document.getElementById('weatherEffect');
    for (let i = 0; i < 100; i++) { // 100 snowflakes
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.animationDuration = `${5 + Math.random() * 5}s`; // between 5-10s
        weatherEffect.appendChild(snowflake);
    }
}

function generateRain() {
    const weatherEffect = document.getElementById('weatherEffect');
    for (let i = 0; i < 100; i++) { // 100 raindrops
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        raindrop.style.left = `${Math.random() * 100}%`; // Random horizontal position
        raindrop.style.animationDuration = `${1 + Math.random()}s`; // Random animation duration (1-2s)
        weatherEffect.appendChild(raindrop);
    }
}

function generateStars() {
    const weatherEffect = document.getElementById('weatherEffect');

    // Create multiple stars
    for (let i = 0; i < 100; i++) { // Adjust the number of stars as needed
        const star = document.createElement('div');
        star.className = 'star';

        // Randomize star position
        star.style.left = `${Math.random() * 100}%`; // Random horizontal position
        star.style.top = `${Math.random() * 100}%`; // Random vertical position

        // Randomize star size
        const starSize = Math.random() * 3 + 1; // Size between 1px and 4px
        star.style.width = `${starSize}px`;
        star.style.height = `${starSize}px`;

        // Randomize animation delay for twinkling effect
        star.style.animationDelay = `${Math.random() * 5}s`;

        const colors = ['#ffffff', '#ffd700', '#add8e6']; // White, gold, light blue
        star.style.background = colors[Math.floor(Math.random() * colors.length)];

        weatherEffect.appendChild(star);
    }
}

function generateClouds() {
    const weatherEffect = document.getElementById('weatherEffect');

    // Number of clouds to generate
    const cloudCount = 30;

    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';

        // Randomly select a cloud image
        const cloudImageIndex = Math.floor(Math.random() * 15) + 1; // Random number between 1 and 15
        cloud.style.backgroundImage = `url('images/cloud${cloudImageIndex}.png')`;

        // Randomize cloud size
        const cloudWidth = 150 + Math.random() * 300; // Width between 150px and 450px
        const cloudHeight = cloudWidth * (0.5 + Math.random() * 0.5); // Height between 50% and 100% of the width
        cloud.style.width = `${cloudWidth}px`;
        cloud.style.height = `${cloudHeight}px`;

        // Randomize cloud position
        cloud.style.left = `${Math.random() * 100}vw`; // Random horizontal position
        cloud.style.top = `${Math.random() * 200}vh`; // Random vertical position

        // Randomize animation duration
        const animationDuration = 60 + Math.random() * 60; // Duration between 60s and 120s
        cloud.style.animationDuration = `${animationDuration}s`;

        cloud.style.zIndex = Math.floor(Math.random() * 3) + 1; // Random z-index between 1 and 3

        // Append the cloud to the weather effect container
        weatherEffect.appendChild(cloud);
    }
}

function generateLightning() {
    const weatherEffect = document.getElementById('weatherEffect');

    // Create a lightning flash element
    const lightning = document.createElement('div');
    lightning.className = 'lightning-flash';
    lightning.style.opacity = `${0.5 + Math.random() * 0.5}`; // Random opacity (0.5-1)
    weatherEffect.appendChild(lightning);

    // Remove the lightning flash after a short duration
    setTimeout(() => {
        weatherEffect.removeChild(lightning);
    }, 200); // Flash duration (200ms)

    // Randomly trigger another lightning flash
    setTimeout(generateLightning, Math.random() * 3000 + 2000); // Random interval (2-5 seconds)
}

function updateBackground(weatherCondition, sunriseUTC, sunsetUTC, locationTimeOffset) {
    const body = document.body;
    const weatherEffect = document.getElementById('weatherEffect');

    // Clear weather-specific effects but keep sun cycle phase
    weatherEffect.innerHTML = '';
    body.classList.remove('clear-weather', 'cloudy-weather', 'rainy-weather', 'stormy-weather', 'snowy-weather', 'foggy-weather');

    // Get the current time in the location's timezone
    const nowUTC = new Date();
    const localTime = new Date(nowUTC.getTime() + locationTimeOffset * 1000);

    // Calculate sunrise and sunset times in local time
    const sunriseLocal = new Date(sunriseUTC.getTime() + locationTimeOffset * 1000);
    const sunsetLocal = new Date(sunsetUTC.getTime() + locationTimeOffset * 1000);

    // Determine the sun cycle phase
    let sunCyclePhase = '';
    if (localTime >= sunriseLocal && localTime < new Date(sunriseLocal.getTime() + 3600000)) {
        sunCyclePhase = 'sunrise'; // 1 hour after sunrise
    } else if (localTime >= new Date(sunsetLocal.getTime() - 3600000) && localTime < sunsetLocal) {
        sunCyclePhase = 'sunset'; // 1 hour before sunset
    } else if (localTime >= sunriseLocal && localTime < sunsetLocal) {
        sunCyclePhase = 'daytime';
    } else {
        sunCyclePhase = 'nighttime';
    }

    // Apply the sun cycle phase class to the body
    body.classList.remove('sunrise', 'sunset', 'daytime', 'nighttime');
    body.classList.add(sunCyclePhase);

    // Apply weather-specific effects
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            body.classList.add('clear-weather');
            if (sunCyclePhase === 'nighttime') {
                generateStars(); // Add twinkling stars for clear nights
            }
            break;
        case 'clouds':
            body.classList.add('cloudy-weather');
            generateClouds();
            break;
        case 'rain':
        case 'drizzle':
            body.classList.add('rainy-weather');
            generateRain();
            break;
        case 'thunderstorm':
            body.classList.add('stormy-weather');
            generateRain();
            generateLightning(); // Trigger lightning effect
            break;
        case 'snow':
            body.classList.add('snowy-weather');
            generateSnow();
            break;
        case 'mist':
        case 'haze':
        case 'fog':
            body.classList.add('foggy-weather');
            generateFog();
            break;
    }

    reverseGradient();

    // Debugging logs
    console.log('Sun Cycle Phase:', sunCyclePhase);
    console.log('Weather Condition:', weatherCondition);
}

function saveSearch(city) {
    // Retrieve the existing searches from localStorage
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];

    // Remove the city if it already exists to avoid duplicates
    searches = searches.filter(search => search.toLowerCase() !== city.toLowerCase());

    // Add the new city to the beginning of the array
    searches.unshift(city);

    // Limit the array to the maximum number of stored searches
    if (searches.length > maxStoredSearches) {
        searches.pop();
    }

    // Save the updated array back to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(searches));
}

function loadRecentSearches() {
    // Retrieve the recent searches from localStorage
    const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];

    // Display the recent searches (you can customize this part)
    const recentSearchesContainer = document.getElementById('recentSearches');
    if (recentSearchesContainer) {
        recentSearchesContainer.innerHTML = ''; // Clear previous content
        searches.forEach(city => {
            const searchItem = document.createElement('div');
            searchItem.textContent = city;
            searchItem.className = 'search-item';
            searchItem.addEventListener('click', () => {
                locationInput.value = city; // Autofill the input with the clicked city
                fetchWeather(city); // Fetch weather for the clicked city
            });
            recentSearchesContainer.appendChild(searchItem);
        });
    }

    if (searches.length > 0) {
        const lastSearch = searches[0]; // Get the most recent search
        locationInput.value = lastSearch; // Autofill the input field
        fetchWeather(lastSearch); // Fetch weather for the last search
    }
}

function reverseGradient() {
    const body = document.body;

    // Check the current background position
    const currentPosition = getComputedStyle(body).backgroundPosition;

    // Toggle between top and bottom
    if (currentPosition === 'top') {
        body.style.backgroundPosition = 'bottom';
    } else {
        body.style.backgroundPosition = 'top';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadRecentSearches(); // Load recent searches and fetch the last search
});
