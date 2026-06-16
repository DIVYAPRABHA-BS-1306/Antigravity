// --- State Management ---
let state = {
  updates: [],
  selectedId: null,
  activeFilter: 'all',
  searchQuery: ''
};

// --- DOM Elements ---
const DOM = {
  refreshBtn: document.getElementById('refreshBtn'),
  refreshIcon: document.getElementById('refreshIcon'),
  searchInput: document.getElementById('searchInput'),
  typeFilters: document.getElementById('typeFilters'),
  notesFeed: document.getElementById('notesFeed'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  resultsCount: document.getElementById('resultsCount'),
  lastUpdatedTime: document.getElementById('lastUpdatedTime'),
  
  // Stats
  statFeatures: document.getElementById('stat-features'),
  statBreaking: document.getElementById('stat-breaking'),
  statIssues: document.getElementById('stat-issues'),
  
  // Floating Action Bar
  floatingBar: document.getElementById('floatingBar'),
  selectedCountText: document.getElementById('selectedCountText'),
  clearSelectionBtn: document.getElementById('clearSelectionBtn'),
  tweetSelectedBtn: document.getElementById('tweetSelectedBtn'),
  
  // Tweet Modal
  tweetModal: document.getElementById('tweetModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelTweetBtn: document.getElementById('cancelTweetBtn'),
  postTweetBtn: document.getElementById('postTweetBtn'),
  tweetContent: document.getElementById('tweetContent'),
  charCount: document.getElementById('charCount')
};

// --- Initial Setup & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  fetchReleaseNotes();
  
  // Refresh Button
  DOM.refreshBtn.addEventListener('click', fetchReleaseNotes);
  
  // Search Input
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderFeed();
  });
  
  // Filter Clicks
  DOM.typeFilters.addEventListener('click', (e) => {
    const filterItem = e.target.closest('.filter-item');
    if (!filterItem) return;
    
    // Toggle active classes
    document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
    filterItem.classList.add('active');
    
    state.activeFilter = filterItem.dataset.filter;
    renderFeed();
  });
  
  // Floating Bar Controls
  DOM.clearSelectionBtn.addEventListener('click', clearSelection);
  DOM.tweetSelectedBtn.addEventListener('click', () => {
    if (state.selectedId) {
      openTweetComposer(state.selectedId);
    }
  });
  
  // Modal Controls
  DOM.closeModalBtn.addEventListener('click', closeTweetModal);
  DOM.cancelTweetBtn.addEventListener('click', closeTweetModal);
  DOM.postTweetBtn.addEventListener('click', postTweetToX);
  
  // Live character counting in Modal
  DOM.tweetContent.addEventListener('input', updateCharCount);
});

// --- API Interactions ---
async function fetchReleaseNotes() {
  try {
    showLoading(true);
    clearSelection();
    
    const response = await fetch('/api/release-notes');
    if (!response.ok) throw new Error('Failed to fetch release notes.');
    const data = await response.json();
    
    if (data.success) {
      state.updates = data.entries;
      
      // Update last updated metadata
      const now = new Date();
      DOM.lastUpdatedTime.textContent = `Updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      // Render Stats & Badges
      calculateStats();
      renderFeed();
    } else {
      showError(data.error);
    }
  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

// --- UI Rendering ---
function renderFeed() {
  // Filter and search
  const filtered = state.updates.filter(item => {
    const matchesFilter = state.activeFilter === 'all' || item.type.toLowerCase() === state.activeFilter.toLowerCase();
    const matchesSearch = item.text.toLowerCase().includes(state.searchQuery) || 
                          item.type.toLowerCase().includes(state.searchQuery) ||
                          item.date.toLowerCase().includes(state.searchQuery);
    return matchesFilter && matchesSearch;
  });
  
  // Results count
  DOM.resultsCount.textContent = `Showing ${filtered.length} update${filtered.length === 1 ? '' : 's'}`;
  
  // Clear feed
  DOM.notesFeed.innerHTML = '';
  
  if (filtered.length === 0) {
    DOM.emptyState.style.display = 'flex';
    return;
  }
  
  DOM.emptyState.style.display = 'none';
  
  // Render cards
  filtered.forEach(item => {
    const isSelected = state.selectedId === item.id;
    const card = document.createElement('div');
    card.className = `note-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = item.id;
    
    card.innerHTML = `
      <div class="card-select-indicator">
        <i class="fa-solid fa-check"></i>
      </div>
      <div class="card-header">
        <span class="type-badge ${item.type.toLowerCase()}">${item.type}</span>
        <span class="card-date">${item.date}</span>
      </div>
      <div class="card-content">
        ${item.html}
      </div>
      <div class="card-actions">
        <a href="${item.link}" target="_blank" class="origin-link" onclick="event.stopPropagation();">
          View Original <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
        <button class="btn-card-tweet" onclick="event.stopPropagation(); openTweetComposer('${item.id}')">
          <i class="fa-brands fa-x-twitter"></i> Tweet Update
        </button>
      </div>
    `;
    
    // Selection listener
    card.addEventListener('click', () => {
      toggleCardSelection(item.id);
    });
    
    DOM.notesFeed.appendChild(card);
  });
}

function calculateStats() {
  const counts = {
    all: state.updates.length,
    Feature: 0,
    Breaking: 0,
    Issue: 0,
    Change: 0,
    Announcement: 0
  };
  
  state.updates.forEach(item => {
    if (counts.hasOwnProperty(item.type)) {
      counts[item.type]++;
    }
  });
  
  // Set sidebar badges
  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-feature').textContent = counts.Feature;
  document.getElementById('count-breaking').textContent = counts.Breaking;
  document.getElementById('count-issue').textContent = counts.Issue;
  document.getElementById('count-change').textContent = counts.Change;
  document.getElementById('count-announcement').textContent = counts.Announcement;
  
  // Set dashboard stats cards
  DOM.statFeatures.textContent = counts.Feature;
  DOM.statBreaking.textContent = counts.Breaking;
  DOM.statIssues.textContent = counts.Issue;
}

// --- Selection Handlers ---
function toggleCardSelection(id) {
  if (state.selectedId === id) {
    state.selectedId = null;
  } else {
    state.selectedId = id;
  }
  
  // Update selection UI
  document.querySelectorAll('.note-card').forEach(card => {
    if (card.dataset.id === state.selectedId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
  
  updateFloatingBar();
}

function clearSelection() {
  state.selectedId = null;
  document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
  updateFloatingBar();
}

function updateFloatingBar() {
  if (state.selectedId) {
    DOM.selectedCountText.textContent = "1 update selected";
    DOM.floatingBar.classList.add('visible');
  } else {
    DOM.floatingBar.classList.remove('visible');
  }
}

// --- Loading & Error States ---
function showLoading(isLoading) {
  if (isLoading) {
    DOM.refreshIcon.classList.add('spinning');
    DOM.refreshBtn.disabled = true;
    DOM.loadingState.style.display = 'flex';
    DOM.notesFeed.style.opacity = '0.5';
  } else {
    DOM.refreshIcon.classList.remove('spinning');
    DOM.refreshBtn.disabled = false;
    DOM.loadingState.style.display = 'none';
    DOM.notesFeed.style.opacity = '1';
  }
}

function showError(msg) {
  alert(`Error: ${msg}`);
}

// --- Tweet Modal Logic ---
function openTweetComposer(id) {
  const update = state.updates.find(item => item.id === id);
  if (!update) return;
  
  // Compose prefilled draft tweet with character limit protection
  const prefix = `🚀 BigQuery Update (${update.date}) [${update.type}]: `;
  const suffix = `\n\nLink: ${update.link}\n#BigQuery #GoogleCloud`;
  
  // Max characters for user text
  const maxContentLen = 280 - prefix.length - suffix.length;
  
  let content = update.text;
  if (content.length > maxContentLen) {
    content = content.substring(0, maxContentLen - 3) + "...";
  }
  
  const draftText = `${prefix}${content}${suffix}`;
  
  DOM.tweetContent.value = draftText;
  updateCharCount();
  
  DOM.tweetModal.classList.add('open');
}

function closeTweetModal() {
  DOM.tweetModal.classList.remove('open');
}

function updateCharCount() {
  const len = DOM.tweetContent.value.length;
  DOM.charCount.textContent = len;
  
  if (len > 280) {
    DOM.charCount.parentElement.classList.add('danger');
    DOM.postTweetBtn.disabled = true;
  } else {
    DOM.charCount.parentElement.classList.remove('danger');
    DOM.postTweetBtn.disabled = false;
  }
}

function postTweetToX() {
  const tweetText = DOM.tweetContent.value.trim();
  if (!tweetText) return;
  
  // URL encode the tweet draft
  const encodedText = encodeURIComponent(tweetText);
  const xIntentUrl = `https://x.com/intent/tweet?text=${encodedText}`;
  
  // Open X (Twitter) in a new tab
  window.open(xIntentUrl, '_blank');
  
  // Close modal and clear selection
  closeTweetModal();
  clearSelection();
}
