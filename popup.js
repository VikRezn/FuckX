const keys = ['ads', 'navPremium', 'navCreator', 'navGrok', 'promos', 'whoToFollow', 'news', 'trends', 'relevant', 'mightLike', 'live', 'blueCheckMuter', 'hideMetrics', 'birdLogo', 'tabLogoEnabled', 'tabLogoBlue', 'pageLogoEnabled', 'pageLogoBlue'];  

chrome.storage.sync.get(keys, (data) => {
  keys.forEach(key => {
    document.getElementById(key).checked = data[key] !== false;
  });
});

const setupToggle = (toggleId, optionsId) => {
  const toggleBtn = document.getElementById(toggleId);
  const optionsDiv = document.getElementById(optionsId);
  toggleBtn.addEventListener('click', () => {
    const isHidden = optionsDiv.style.display === 'none';
    optionsDiv.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = toggleBtn.textContent.replace(isHidden ? '▶' : '▼', isHidden ? '▼' : '▶');
  });
};

setupToggle('toggle-birdLogo', 'birdLogoOptions');
setupToggle('toggle-tabLogo', 'tabLogoOptions');
setupToggle('toggle-pageLogo', 'pageLogoOptions');

keys.forEach(key => {
  document.getElementById(key).addEventListener('change', (e) => {
    chrome.storage.sync.set({ [key]: e.target.checked }, () => {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if(tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "update"}, () => chrome.runtime.lastError);
        }
      });
    });
  });
}); 