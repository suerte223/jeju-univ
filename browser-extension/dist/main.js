
 form.addEventListener('submit', (e) => handleSubmit(e));
 clearBtn.addEventListener('click', (e) => reset(e));
 init();

 function reset(e) {
    e.preventDefault();
    localStorage.removeItem('regionName');
    init();
 }

 function init() {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedRegion = localStorage.getItem('regionName');
    //set icon to be generic green
    //todo
    if (storedApiKey === null || storedRegion === null) {
        form.style.display = 'block';
        results.style.display = 'none';
        loading.style.display = 'none';
        clearBtn.style.display = 'none';
        errors.textContent = '';
    } else {
        displayCarbonUsage(storedApiKey, storedRegion);
        results.style.display = 'none';
        form.style.display = 'none';
        clearBtn.style.display = 'block';
    }
 };
 function handleSubmit(e) {
    e.preventDefault();
    setUpUser(apiKey.value, region.value);
 }
function setUpUser(apiKey, regionName) {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionName', regionName);
    loading.style.display = 'block';
    errors.textContent = '';
    clearBtn.style.display = 'block';
    displayCarbonUsage(apiKey, regionName);
 }