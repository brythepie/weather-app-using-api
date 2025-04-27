const apiKey = "a9bd344737e10da594a9baad29940aff"; // replaced broken apiKey with functioning apiKey
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const geoApiUrl = 'https://api.openweathermap.org/geo/1.0/direct';

// Add an event listener to the input field to fetch suggestions
locationInput.addEventListener('input', () => {
    const query = locationInput.value.trim();
    if (query.length > 2) { // Fetch suggestions only if input length > 2
        fetchCitySuggestions(query);
    }
});

function fetchCitySuggestions(query) {
    const url = `${geoApiUrl}?q=${query}&limit=5&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const datalist = document.getElementById('citySuggestions');
            datalist.innerHTML = ''; // Clear previous suggestions

            data.forEach(city => {
                const option = document.createElement('option');
                option.value = `${city.name}, ${city.country}`;
                datalist.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching city suggestions:', error);
        });
}

function fetchWeather(location) {
    const url = `${apiUrl}?q=${location}&appid=${apiKey}&units=imperial`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            locationElement.textContent = `${data.name}, ${data.sys.country}`;
            temperatureElement.textContent = `${Math.round(data.main.temp)}°`;
            descriptionElement.textContent = data.weather[0].description;

            // Update additional fields
            document.getElementById('humidity').textContent = `${data.main.humidity}%`;
            document.getElementById('wind').textContent = `${data.wind.speed} mph`;
            document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
            document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°`;
            document.getElementById('visibility').textContent = `${(data.visibility / 1609).toFixed(1)} mi`; // meters to miles

            // Sunrise and Sunset
            const sunriseTime = new Date(data.sys.sunrise * 1000);
            const sunsetTime = new Date(data.sys.sunset * 1000);

            document.getElementById('sunrise').textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('sunset').textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            updateBackground(data.weather[0].main);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
}

const maxStoredSearches = 5; // Limit the number of stored searches

searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        saveSearch(location); // Save the search to localStorage
        fetchWeather(location);
    }
});

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
}

function updateBackground(weatherCondition) {
    const body = document.body;
    const weatherEffect = document.getElementById('weatherEffect');

    // Clear any existing background classes/animations
    body.className = '';
    weatherEffect.innerHTML = '';

    // Set background/animation based on the weather condition
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            body.classList.add('clear-weather');
            break;
        case 'clouds':
            body.classList.add('cloudy-weather');
            break;
        case 'rain':
        case 'drizzle':
            body.classList.add('rainy-weather');
            generateRain();
            break;
        case 'thunderstorm':
            body.classList.add('stormy-weather');
            generateRain();
            break;
        case 'snow':
            body.classList.add('snowy-weather');
            generateSnow(); 
            break;
        default:
            body.classList.add('default-weather');
            break;
    }

    body.classList.add('d-flex', 'flex-column');
}

function generateSnow() {
    const weatherEffect = document.getElementById('weatherEffect');
    for (let i = 0; i < 50; i++) { // 50 snowflakes
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
        raindrop.style.left = `${Math.random() * 100}%`;
        raindrop.style.animationDuration = `${1 + Math.random()}s`; // between 1-2s
        weatherEffect.appendChild(raindrop);
    }
}

// Load recent searches on page load
document.addEventListener('DOMContentLoaded', loadRecentSearches);