const apiKey = '28dd9020c5883464f5fea254c96696aa';
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

searchButton.addEventListener('click', () => {
    const location = locationInput.value;
    if (location) {
        fetchWeather(location);
    }
});

function fetchWeather(location) {
    const url = `${apiUrl}?q=${location}&appid=${apiKey}&units=imperial`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            locationElement.textContent = data.name;
            temperatureElement.textContent = `${Math.round(data.main.temp)}°F`;
            descriptionElement.textContent = data.weather[0].description;

            const currentTime = new Date().getTime() / 1000; // Current time in seconds
            const sunrise = data.sys.sunrise; // Sunrise time in seconds
            const sunset = data.sys.sunset; // Sunset time in seconds

            // Determine the time of day
            let timeOfDay = '';
            if (currentTime >= sunrise && currentTime < sunrise + 3600) {
                timeOfDay = 'sunrise'; // 1 hour after sunrise
            } else if (currentTime >= sunset - 3600 && currentTime < sunset) {
                timeOfDay = 'sunset'; // 1 hour before sunset
            } else if (currentTime >= sunrise && currentTime < sunset) {
                timeOfDay = 'day';
            } else {
                timeOfDay = 'night';
            }

            updateBackground(data.weather[0].main); // Update background based on weather condition
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

    // Clear any existing background classes
    body.className = '';

    // Set a background based on the weather condition
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
            break;
        case 'thunderstorm':
            body.classList.add('stormy-weather');
            break;
        case 'snow':
            body.classList.add('snowy-weather');
            break;
        default:
            body.classList.add('default-weather');
            break;
    }
}

// Load recent searches on page load
document.addEventListener('DOMContentLoaded', loadRecentSearches);