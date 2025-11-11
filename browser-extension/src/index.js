/* src/index.js — 다지역(3개) 조회 업그레이드 버전 */

// 1) DOM
const form = document.querySelector('.form-data');
const regionInput = document.querySelector('.region-name'); // 쉼표로 여러 지역 입력
const apiKeyInput = document.querySelector('.api-key');
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const resultsContainer = document.querySelector('.result-container');
const resultDiv = document.querySelector('.result');
const usage = document.querySelector('.carbon-usage');        // (단일 표기 영역은 사용 안 함)
const fossilfuel = document.querySelector('.fossil-fuel');    // (단일 표기 영역은 사용 안 함)
const myregion = document.querySelector('.my-region');        // (단일 표기 영역은 사용 안 함)
const clearBtn = document.querySelector('.clear-btn');

// 2) 공용: 색상 계산
const CO2_SCALE = [0, 150, 600, 750, 800];
const COLORS = ['#2AA364', '#F5EB4D', '#9E4229', '#381D02', '#381D02'];

const colorForValue = (value) => {
  const closest = [...CO2_SCALE].sort((a, b) => Math.abs(a - value) - Math.abs(b - value))[0];
  const idx = CO2_SCALE.findIndex(n => n > closest);
  return COLORS[idx];
};

// (기존 calculateColor 이름도 유지 — 아이콘 업데이트용으로 래핑)
const calculateColor = (value) => {
  const c = colorForValue(value);
  chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: c } });
  return c;
};

// 3) 유틸: 지역 파싱/저장
const parseRegions = (inputStr) => {
  return inputStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3); // 과제 조건: 최대 3개
};

const getStored = () => {
  const storedApiKey = localStorage.getItem('apiKey');
  const legacyRegion = localStorage.getItem('regionName'); // 이전 단일 저장 호환
  const storedRegions = localStorage.getItem('regions');

  let regions = [];
  if (storedRegions) {
    try { regions = JSON.parse(storedRegions) || []; } catch {}
  } else if (legacyRegion) {
    regions = [legacyRegion];
  }
  return { storedApiKey, regions };
};

const saveUser = (apiKey, regions) => {
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('regions', JSON.stringify(regions));
  // 호환 목적의 단일 키도 첫 지역으로 유지
  if (regions.length > 0) localStorage.setItem('regionName', regions[0]);
};

// 4) 렌더: 카드 뷰
const renderCards = (items) => {
  // items: [{ zone, carbonIntensity, fossilFuelPercentage|null, color }]
  resultsContainer.innerHTML = `
    <div class="grid-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
      ${items.map(it => `
        <article class="card" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff;">
          <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <strong style="font-size:16px;">${it.zone}</strong>
            <span title="상태색" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${it.color};"></span>
          </header>
          <div>
            <div style="font-size:14px;line-height:1.4;">탄소집약도</div>
            <div style="font-size:20px;font-weight:700;margin-bottom:6px;">${it.carbonIntensity} gCO₂/kWh</div>
            ${typeof it.fossilFuelPercentage === 'number'
              ? `<div style="font-size:12px;color:#64748b;">화석연료 비중: ${it.fossilFuelPercentage.toFixed(2)}%</div>`
              : `<div style="font-size:12px;color:#94a3b8;">화석연료 비중 데이터 없음</div>`
            }
          </div>
        </article>
      `).join('')}
    </div>
  `;
};

// 5) 다지역 조회(fetch + Promise.all)
async function fetchZone(apiKey, zone) {
  const res = await fetch(`https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=${encodeURIComponent(zone)}`, {
    method: 'GET',
    headers: { 'auth-token': apiKey },
  });
  if (!res.ok) throw new Error(`${zone}: ${res.status}`);
  const data = await res.json();
  const ci = Math.round(data.carbonIntensity);
  return {
    zone,
    carbonIntensity: ci,
    fossilFuelPercentage: typeof data.fossilFuelPercentage === 'number' ? data.fossilFuelPercentage : null,
    color: colorForValue(ci),
  };
}

async function displayCarbonUsageMulti(apiKey, regions) {
  try {
    loading.style.display = 'block';
    resultsContainer.style.display = 'none';
    errors.textContent = '';
    errors.style.display = 'none';

    const tasks = regions.map(z => fetchZone(apiKey, z));
    const results = await Promise.allSettled(tasks);

    const okItems = [];
    const failZones = [];

    for (const r of results) {
      if (r.status === 'fulfilled') okItems.push(r.value);
      else {
        const msg = r.reason?.message || '';
        // 실패한 zone 이름 추출 시도
        const z = msg?.split(':')?.[0] || 'Unknown';
        failZones.push(z);
      }
    }

    if (okItems.length === 0) {
      throw new Error(`모든 지역 조회 실패: ${failZones.join(', ')}`);
    }

    // 아이콘 색상: 가장 나쁜(탄소집약도 가장 높은) 지역 기준
    const worst = okItems.reduce((a, b) => a.carbonIntensity >= b.carbonIntensity ? a : b);
    chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: worst.color } });

    // 렌더
    renderCards(okItems);

    // 성공 UI
    loading.style.display = 'none';
    resultsContainer.style.display = 'block';
    resultDiv.style.display = 'block';
    // 단일 텍스트 영역은 다지역에서는 숨기거나 비움
    if (myregion) myregion.textContent = '';
    if (usage) usage.textContent = '';
    if (fossilfuel) fossilfuel.textContent = '';

    // 일부 실패 안내(있다면)
    if (failZones.length > 0) {
      errors.style.display = 'block';
      errors.textContent = `일부 지역 조회 실패: ${failZones.join(', ')}`;
    }

  } catch (err) {
    console.error('Error fetching multi carbon data:', err);
    loading.style.display = 'none';
    resultsContainer.style.display = 'none';
    errors.style.display = 'block';
    errors.textContent = 'Sorry, we couldn\'t fetch data for those regions.';

    form.style.display = 'block';
    clearBtn.style.display = 'none';
    resultDiv.style.display = 'none';

    localStorage.removeItem('apiKey');
    localStorage.removeItem('regions');
    localStorage.removeItem('regionName');
  }
}

// 6) 초기화
function init() {
  const { storedApiKey, regions } = getStored();

  // 아이콘 기본: green
  chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: 'green' } });

  if (!storedApiKey || regions.length === 0) {
    form.style.display = 'block';
    resultDiv.style.display = 'none';
    loading.style.display = 'none';
    clearBtn.style.display = 'none';
    errors.textContent = '';
    // 입력란 프리셋(과제 편의)
    if (regionInput && !regionInput.value) regionInput.value = 'KR,JP-KY,CN';
  } else {
    form.style.display = 'none';
    resultDiv.style.display = 'block';
    loading.style.display = 'block';
    resultsContainer.style.display = 'none';
    clearBtn.style.display = 'block';
    displayCarbonUsageMulti(storedApiKey, regions);
  }
}

// 7) 폼/세팅/리셋
function handleSubmit(e) {
  e.preventDefault();
  const regions = parseRegions(regionInput.value || '');
  if (regions.length < 3 || !regions.includes('KR')) {
    errors.style.display = 'block';
    errors.textContent = '과제 조건: KR 포함 총 3개 지역을 쉼표로 입력하세요. 예) KR,JP-KY,CN';
    return;
  }
  setUpUser(apiKeyInput.value, regions);
}

function setUpUser(apiKey, regions) {
  saveUser(apiKey, regions);
  form.style.display = 'none';
  resultDiv.style.display = 'block';
  loading.style.display = 'block';
  resultsContainer.style.display = 'none';
  errors.textContent = '';
  clearBtn.style.display = 'block';
  displayCarbonUsageMulti(apiKey, regions);
}

function reset(e) {
  e.preventDefault();
  localStorage.removeItem('regions');
  localStorage.removeItem('regionName');
  localStorage.removeItem('apiKey');
  init();
}

// 8) 리스너
form.addEventListener('submit', handleSubmit);
clearBtn.addEventListener('click', reset);
init();
