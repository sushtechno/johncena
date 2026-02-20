const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const weatherContainer = document.getElementById("weatherContainer");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

function showLoading() {
  weatherContainer.innerHTML = `
    <div class="loading">
      <div class="spinner" aria-hidden="true"></div>
      <p>Fetching weather details...</p>
    </div>
  `;
}

function showError(message) {
  weatherContainer.innerHTML = `
    <p class="error-message">${message}</p>
  `;
}

function displayWeather(data) {
  const weather = data.weather?.[0]?.description ?? "N/A";
  const temp = Math.round(data.main?.temp ?? 0);
  const feelsLike = Math.round(data.main?.feels_like ?? 0);
  const humidity = data.main?.humidity ?? "N/A";
  const wind = data.wind?.speed ?? "N/A";

  weatherContainer.innerHTML = `
    <article class="weather-card">
      <h2>${data.name}, ${data.sys?.country ?? ""}</h2>
      <p><strong>${weather}</strong></p>
      <div class="weather-grid">
        <p>Temperature: ${temp}°C</p>
        <p>Feels like: ${feelsLike}°C</p>
        <p>Humidity: ${humidity}%</p>
        <p>Wind: ${wind} m/s</p>
      </div>
    </article>
  `;
}

async function getWeather(city) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showError("Please add your OpenWeatherMap API key in app.js first.");
    return;
  }

  searchBtn.disabled = true;
  showLoading();

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: city,
        appid: API_KEY,
        units: "metric"
      }
    });

    displayWeather(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      showError("City not found. Please try another city name.");
    } else {
      showError("Something went wrong while fetching weather data. Try again.");
    }
  } finally {
    searchBtn.disabled = false;
    cityInput.focus();
  }
}

function handleSearch() {
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name before searching.");
    cityInput.focus();
    return;
  }

  getWeather(city);
  cityInput.value = "";
}

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});
