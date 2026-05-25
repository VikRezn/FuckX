let prefs = { ads: true, navPremium: true, navCreator: true, navGrok: true, promos: true, whoToFollow: true, news: true, trends: true, relevant: true, mightLike: true, live: true, blueCheckMuter: false, hideMetrics: false, birdLogo: true, tabLogoEnabled: true, tabLogoBlue: true, pageLogoEnabled: true, pageLogoBlue: true };

chrome.storage.sync.get(prefs, (data) => {
  prefs = data;
  applyFilters();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "update") {
    chrome.storage.sync.get(prefs, (data) => {
      prefs = data;
      applyFilters();
      if (typeof updateHead === 'function') updateHead();
    });
  }
});

document.addEventListener('mousedown', function(e) {
  if (e.target.closest('a') && window.getSelection().toString().length > 0) {
    window.getSelection().removeAllRanges();
  }
}, true);

const applyFilters = () => {
  const adSpans = document.querySelectorAll('[data-testid="cellInnerDiv"] span, [data-testid="trend"] span, aside span');
  adSpans.forEach(span => {
    if (span.textContent.trim() === 'Ad' || span.textContent.trim() === 'Promoted') {
      const container = span.closest('[data-testid="cellInnerDiv"]') || span.closest('[data-testid="trend"]') || span.closest('aside');
      if (container) container.style.display = prefs.ads ? 'none' : '';
    }
  });

  let inWhoToFollowFeed = false;
  document.querySelectorAll('[data-testid="cellInnerDiv"]').forEach(cell => {
    const text = cell.textContent || '';
    const hasWhoToFollowHeader = cell.querySelector('h2') && text.includes('Who to follow');
    const hasUserCell = cell.querySelector('[data-testid="UserCell"]');
    const isShowMore = cell.querySelector('a[href*="/i/connect_people"]') || text === 'Show more';
    const isTweet = cell.querySelector('article');

    if (hasWhoToFollowHeader) {
      inWhoToFollowFeed = true;
    } else if (inWhoToFollowFeed && isTweet && !hasUserCell) {
      inWhoToFollowFeed = false;
    }

    if (inWhoToFollowFeed) {
      cell.style.display = prefs.whoToFollow ? 'none' : '';
      if (isShowMore) {
        inWhoToFollowFeed = false;
      }
    }

    if (cell.querySelector('h2') && text.includes('Live on X')) {
      cell.style.display = prefs.live ? 'none' : '';
    }

    const verifiedBadge = cell.querySelector('[data-testid="icon-verified"]');
    if (verifiedBadge) {
      verifiedBadge.style.display = prefs.blueCheckMuter ? 'none' : '';
    }

    if (isTweet) {
      cell.querySelectorAll('[data-testid="app-text-transition-container"]').forEach(stat => {
        stat.style.display = prefs.hideMetrics ? 'none' : '';
      });
      const views = cell.querySelector('a[href*="/analytics"]');
      if (views) views.style.display = prefs.hideMetrics ? 'none' : '';
    }
  });

  const leftNavItems = document.querySelectorAll('header[role="banner"] a, header[role="banner"] [role="button"]');
  leftNavItems.forEach(item => {
    const text = item.textContent.trim();
    if (text === 'Premium') {
      item.style.display = prefs.navPremium ? 'none' : '';
    } else if (text === 'Creator Studio') {
      item.style.display = prefs.navCreator ? 'none' : '';
    } else if (text === 'Grok') {
      item.style.display = prefs.navGrok ? 'none' : '';
    }
  });

  const xPath = "M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z";
  const birdPath = "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z";

  document.querySelectorAll(`path[d="${xPath}"], path[d="${birdPath}"]`).forEach(path => {
    if (prefs.birdLogo && prefs.pageLogoEnabled) {
      if (path.getAttribute('d') !== birdPath) path.setAttribute('d', birdPath);
      path.style.fill = prefs.pageLogoBlue ? '#1d9bf0' : '';
    } else {
      if (path.getAttribute('d') !== xPath) path.setAttribute('d', xPath);
      path.style.fill = '';
    }
  });

  const sidebar = document.querySelector('[data-testid="sidebarColumn"]');
  if (sidebar) {
    let mainLayout = null;
    const footer = sidebar.querySelector('nav');
    
    if (footer) {
      let curr = footer;
      while(curr && curr !== sidebar) {
        const hasHeader = curr.querySelector('h2') || curr.querySelector('[role="search"]');
        if (hasHeader && curr.children.length >= 3) {
          mainLayout = curr;
          break;
        }
        curr = curr.parentElement;
      }
    }

    if (mainLayout) {
      let lastVisibleWidget = false;
      let pendingSpacers = [];

      Array.from(mainLayout.children).forEach(child => {
        const text = child.textContent || '';
        let isWidget = false;
        let shouldHide = false;

        if (child.querySelector('[role="search"]')) {
          isWidget = true;
          shouldHide = false;
          if (text.includes('Subscribe to Premium') && prefs.promos) {
            const spans = Array.from(child.querySelectorAll('span'));
            const promoSpan = spans.find(s => s.textContent.trim() === 'Subscribe to Premium');
            if (promoSpan) {
              let promoParent = promoSpan;
              while(promoParent.parentElement && promoParent.parentElement !== child && !promoParent.parentElement.querySelector('[role="search"]')) {
                promoParent = promoParent.parentElement;
              }
              promoParent.style.display = 'none';
            }
          }
        } else if (child.querySelector('[id^="div-gpt-ad-"]') || Array.from(child.querySelectorAll('span')).some(s => s.textContent.trim() === 'Ad' || s.textContent.trim() === 'Promoted')) {
          isWidget = true;
          shouldHide = prefs.ads;
        } else if (child.querySelector('nav') || text.includes('Terms of Service')) {
          isWidget = true;
          shouldHide = false;
        } else if (text.includes('Subscribe to Premium')) {
          isWidget = true;
          shouldHide = prefs.promos;
        } else if (text.includes('Today’s News')) {
          isWidget = true;
          shouldHide = prefs.news;
        } else if (text.includes('What’s happening')) {
          isWidget = true;
          shouldHide = prefs.trends;
        } else if (text.includes('Who to follow')) {
          isWidget = true;
          shouldHide = prefs.whoToFollow;
        } else if (text.includes('Relevant people')) {
          isWidget = true;
          shouldHide = prefs.relevant;
        } else if (text.includes('You might like')) {
          isWidget = true;
          shouldHide = prefs.mightLike;
        } else if (text.includes('Live on X')) {
          isWidget = true;
          shouldHide = prefs.live;
        } else if (child.querySelector('h2')) {
          isWidget = true;
          shouldHide = false;
        } else {
          isWidget = false;
        }

        if (isWidget) {
          child.style.display = shouldHide ? 'none' : '';
          if (!shouldHide) {
            if (lastVisibleWidget && pendingSpacers.length > 0) {
              pendingSpacers[0].style.display = '';
              for (let i = 1; i < pendingSpacers.length; i++) {
                pendingSpacers[i].style.display = 'none';
              }
            }
            lastVisibleWidget = true;
            pendingSpacers = [];
          }
        } else {
          child.style.display = 'none';
          if (lastVisibleWidget) {
            pendingSpacers.push(child);
          }
        }
      });

      pendingSpacers.forEach(s => s.style.display = 'none');
    }
  }
};

const observer = new MutationObserver(applyFilters);
observer.observe(document.documentElement, { childList: true, subtree: true });

const updateHead = () => {
  const showTabLogo = prefs.birdLogo && prefs.tabLogoEnabled;
  
  if (showTabLogo) {
    if (document.title.endsWith(' / X')) document.title = document.title.replace(' / X', ' / Twitter');
    if (document.title === 'X') document.title = 'Twitter';
  } else {
    if (document.title.endsWith(' / Twitter')) document.title = document.title.replace(' / Twitter', ' / X');
    if (document.title === 'Twitter') document.title = 'X';
  }
  
  const iconColor = prefs.tabLogoBlue ? '%231d9bf0' : '%23e7e9ea';
  const birdIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${iconColor}" d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>`;
  const xIcon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23e7e9ea" d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"/></svg>';
  
  document.querySelectorAll('link[rel="shortcut icon"], link[rel="icon"]').forEach(link => {
    const targetIcon = showTabLogo ? birdIcon : xIcon;
    if (link.href !== targetIcon) link.href = targetIcon;
  });
};

const headObserver = new MutationObserver(updateHead);
headObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
updateHead();