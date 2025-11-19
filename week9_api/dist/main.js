// main.js
(() => {
  // ===== DOM 요소 =====
  const form = document.querySelector(".form-data");
  const regionInput = document.querySelector(".region-name");

  const errors = document.querySelector(".errors");
  const loading = document.querySelector(".loading");
  const resultBox = document.querySelector(".result");
  const resultContainer = document.querySelector(".result-container");

  const myRegion = document.querySelector(".my-region");
  const carbonUsage = document.querySelector(".carbon-usage");
  const fossilFuel = document.querySelector(".fossil-fuel");
  const clearBtn = document.querySelector(".clear-btn");

  const LOCAL_KEY_CITY = "lastCityName";

  // ===== 상태 표시 함수 =====
  function showLoading() {
    if (loading) loading.style.display = "block";
    if (errors) errors.style.display = "none";
  }

  function hideLoading() {
    if (loading) loading.style.display = "none";
  }

  function showError(msg) {
    if (!errors) return;
    errors.textContent = msg;
    errors.style.display = "block";
  }

  function clearError() {
    if (!errors) return;
    errors.textContent = "";
    errors.style.display = "none";
  }

  // ===== 온도 → 아이콘 색 =====
  function getColorByTemperature(temp) {
    if (temp <= 0) return "#3b82f6";   // 파랑
    if (temp <= 15) return "#22c55e";  // 초록
    if (temp <= 25) return "#eab308";  // 노랑
    return "#ef4444";                  // 빨강
  }

  // ===== Open-Meteo 날씨 가져오기 =====
  async function fetchWeatherByCity(cityName) {
    if (!cityName || cityName.trim().length < 2) {
      showError("도시 이름을 2글자 이상 입력해 주세요.");
      return;
    }

    showLoading();
    clearError();

    try {
      // 1) 지오코딩: 도시 → 위도/경도
      const geoUrl =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(cityName)}` +
        `&count=1&language=en&format=json`;

      const geoRes = await fetch(geoUrl, { mode: "cors" });
      if (!geoRes.ok) {
        throw new Error("Geocoding failed: " + geoRes.status);
      }

      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        hideLoading();
        showError("해당 도시를 찾을 수 없어요. 철자를 다시 확인해 주세요.");
        return;
      }

      const place = geoData.results[0];
      const { latitude, longitude, name, country } = place;

      // 2) 날씨 API
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current_weather=true` +
        `&timezone=auto`;

      const weatherRes = await fetch(weatherUrl, { mode: "cors" });
      if (!weatherRes.ok) {
        throw new Error("Weather request failed: " + weatherRes.status);
      }

      const weatherData = await weatherRes.json();
      const current = weatherData.current_weather;
      if (!current) {
        hideLoading();
        showError("현재 날씨 데이터를 가져오지 못했어요.");
        return;
      }

      const temperature = current.temperature;
      const windspeed = current.windspeed;
      const winddirection = current.winddirection;
      const weathercode = current.weathercode;

      // 3) 아이콘 색 업데이트
      const color = getColorByTemperature(temperature);

      // ✅ 확장 프로그램 환경에서만 실행되도록 방어 코드 추가
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.sendMessage === "function"
      ) {
        chrome.runtime.sendMessage({
          action: "updateIcon",
          value: { color },
        });
      }


      // 4) 화면에 값 표시
      hideLoading();

      if (resultBox) resultBox.style.display = "block";
      if (resultContainer) resultContainer.style.display = "block";
      if (clearBtn) clearBtn.style.display = "inline-block";

      const regionLabel = `${name}${country ? ", " + country : ""}`;
      myRegion.textContent = regionLabel;
      carbonUsage.textContent = `${temperature}°C`;
      fossilFuel.textContent = `Wind ${windspeed} km/h · Dir ${winddirection}° · Code ${weathercode}`;

      // 5) 마지막 도시 저장
      localStorage.setItem(LOCAL_KEY_CITY, cityName);
    } catch (err) {
      console.error("Error fetching weather:", err);
      hideLoading();
      showError("날씨 정보를 가져오는 데 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  // ===== 초ㅣㄱ화 =====
  function init() {
    if (resultBox) resultBox.style.display = "block";
    if (resultContainer) resultContainer.style.display = "block";
    if (loading) loading.style.display = "none";
    clearError();

    // 초기 상태: 비어 있는 화면
    if (clearBtn) clearBtn.style.display = "none";

    if (regionInput) regionInput.value = "";
    if (myRegion) myRegion.textContent = "Type a city below";
    if (carbonUsage) carbonUsage.textContent = "--°C";
    if (fossilFuel) fossilFuel.textContent = "";
  }

  // ===== 이벤트 =====
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const cityName = regionInput.value.trim();
      fetchWeatherByCity(cityName);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem(LOCAL_KEY_CITY);
      regionInput.value = "";
      myRegion.textContent = "Type a city below";
      carbonUsage.textContent = "--°C";
      fossilFuel.textContent = "";
      clearError();
    });
  }

  init();
})();
