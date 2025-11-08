// Content script for Memory Capture Extension - Vanilla JavaScript
/* global chrome */

const STORAGE_KEY = 'memory_capture_data';

// Panel state
let isPanelOpen = false;
let sidePanel = null;
let floatingStartButton = null;

// Show floating save button on text selection
let floatingButton = null;
let lastSelection = null;

// Initialize floating start button (always visible)
function initFloatingStartButton() {
  if (floatingStartButton) return;

  floatingStartButton = document.createElement('div');
  floatingStartButton.id = 'memory-floating-start-button';
  floatingStartButton.innerHTML = `
    <button title="Quick Capture (Click to save page)" class="capture-main-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
      </svg>
      <span class="capture-label">Capture</span>
    </button>
    <button title="Open Memories Panel" class="panel-toggle-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
      </svg>
    </button>
  `;

  // Quick capture button - stops event propagation
  floatingStartButton.querySelector('.capture-main-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    quickCapture();
  });

  // Panel toggle button - stops event propagation
  floatingStartButton.querySelector('.panel-toggle-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    togglePanel();
  });

  document.body.appendChild(floatingStartButton);
}

// Toggle side panel
function togglePanel() {
  if (isPanelOpen) {
    closePanel();
  } else {
    openPanel();
  }
}

// Open side panel
function openPanel() {
  if (!sidePanel) {
    createSidePanel();
  }

  isPanelOpen = true;
  sidePanel.classList.add('open');
  loadMemoriesIntoPanel();
}

// Close side panel
function closePanel() {
  if (sidePanel) {
    isPanelOpen = false;
    sidePanel.classList.remove('open');
  }
}

// Create side panel - Independent window over existing page
function createSidePanel() {
  sidePanel = document.createElement('div');
  sidePanel.id = 'memory-side-panel';
  sidePanel.innerHTML = `
    <div class="panel-header">
      <h2>Memory Capture</h2>
      <button class="panel-close-btn" title="Close">×</button>
    </div>

    <div class="panel-actions">
      <button class="panel-save-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Save This Page
      </button>
    </div>

    <div class="panel-search">
      <input type="text" placeholder="Search memories..." id="panel-search-input">
    </div>

    <div class="panel-stats">
      <span id="panel-stats-text">0 memories saved</span>
    </div>

    <div class="panel-content" id="panel-memories-list">
      <div class="panel-empty">
        <p>No memories yet</p>
        <p class="hint">Save this page or select text to get started</p>
      </div>
    </div>
  `;

  document.body.appendChild(sidePanel);

  // Event listeners - all stop propagation to prevent closing
  sidePanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  sidePanel.querySelector('.panel-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    closePanel();
  });

  sidePanel.querySelector('.panel-save-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    saveCurrentPageFromPanel();
  });

  sidePanel.querySelector('#panel-search-input').addEventListener('input', handlePanelSearch);
}

// Load memories into panel
async function loadMemoriesIntoPanel() {
  // Show loading state
  const listContainer = sidePanel?.querySelector('#panel-memories-list');
  if (listContainer) {
    listContainer.innerHTML = `
      <div class="panel-empty">
        <div class="loading-spinner" style="margin: 0 auto 16px;"></div>
        <p>Loading memories...</p>
      </div>
    `;
  }

  const memories = await getMemoriesFromStorage();
  updatePanelStats(memories);
  displayMemoriesInPanel(memories);
}

// Get memories from API via background script (with fallback to storage)
async function getMemoriesFromStorage() {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated, returning empty array');
      return [];
    }

    // Get current user first
    const userResponse = await chrome.runtime.sendMessage({ action: 'getAuthUser' });
    const user = userResponse?.user;

    if (!user) {
      console.log('No user authenticated, returning empty array');
      return [];
    }

    // Try to fetch from API first (most up-to-date)
    try {
      const apiResponse = await chrome.runtime.sendMessage({
        action: 'fetchMemoriesFromAPI'
      });

      if (apiResponse && apiResponse.success && apiResponse.data) {
        // Update local storage with API data
        const storageKey = `${STORAGE_KEY}_${user.id}`;
        await chrome.runtime.sendMessage({
          action: 'setToStorage',
          key: storageKey,
          value: apiResponse.data
        });
        return apiResponse.data || [];
      }
    } catch (apiError) {
      console.log('API fetch failed, falling back to local storage:', apiError);
    }

    // Fallback to local storage
    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const response = await chrome.runtime.sendMessage({
      action: 'getFromStorage',
      key: storageKey
    });

    if (response && response.success) {
      return response.data || [];
    }
    return [];
  } catch (error) {
    // Check if it's a context invalidation error
    if (error.message?.includes('Extension context invalidated')) {
      console.log('Extension was reloaded, please refresh the page');
      showNotification('Extension was updated. Please refresh the page.', 'info');
      return [];
    }
    console.error('Error reading memories:', error);
    return [];
  }
}

// Update panel stats
function updatePanelStats(memories) {
  const statsText = sidePanel.querySelector('#panel-stats-text');
  statsText.textContent = `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'} saved`;
}

// Display memories in panel
function displayMemoriesInPanel(memories) {
  const listContainer = sidePanel.querySelector('#panel-memories-list');

  if (memories.length === 0) {
    listContainer.innerHTML = `
      <div class="panel-empty">
        <p>No memories yet</p>
        <p class="hint">Save this page or select text to get started</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = memories.map(memory => {
    const safeMemory = {
      id: memory.id || Date.now(),
      favicon: memory.favicon || '',
      page_title: memory.page_title || 'Untitled',
      created_at: memory.created_at || new Date().toISOString(),
      selected_text: memory.selected_text || '',
      tags: memory.tags || [],
      content_type: memory.content_type || 'page',
      url: memory.url || '#'
    };

    const textPreview = safeMemory.selected_text
      ? `<p class="panel-memory-text">${escapeHtml(safeMemory.selected_text.substring(0, 150))}${safeMemory.selected_text.length > 150 ? '...' : ''}</p>`
      : '';

    const tagsHtml = safeMemory.tags.length > 0
      ? `<div class="panel-memory-tags">${safeMemory.tags.map(tag => `<span class="panel-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';

    const videoTimestamp = memory.video_info && memory.video_info.currentTime
      ? `<div class="video-timestamp">🎬 ${formatTime(memory.video_info.currentTime)}</div>`
      : '';

    return `
      <div class="panel-memory-card" data-id="${safeMemory.id}">
        <div class="panel-memory-header">
          ${safeMemory.favicon ? `<img src="${safeMemory.favicon}" alt="" class="panel-favicon">` : ''}
          <div class="panel-memory-meta">
            <h3 class="panel-memory-title">${escapeHtml(safeMemory.page_title)}</h3>
            <span class="panel-memory-time">${formatDate(safeMemory.created_at)}</span>
          </div>
          <button class="panel-delete-btn" data-id="${safeMemory.id}" title="Delete">×</button>
        </div>
        ${videoTimestamp}
        ${textPreview}
        ${tagsHtml}
        <div class="panel-memory-footer">
          <span class="panel-content-type">${safeMemory.content_type}</span>
          <a href="${safeMemory.url}" target="_blank" class="panel-view-link">View →</a>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners for delete buttons - all stop propagation
  listContainer.querySelectorAll('.panel-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteMemoryFromPanel(parseInt(btn.dataset.id));
    });
  });

  // Add event listeners for opening memories
  listContainer.querySelectorAll('.panel-memory-title').forEach(title => {
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.panel-memory-card');
      const memory = memories.find(m => m.id === parseInt(card.dataset.id));
      if (memory) {
        window.open(memory.url, '_blank');
      }
    });
  });

  // Stop propagation on all links
  listContainer.querySelectorAll('.panel-view-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Save current page from panel
async function saveCurrentPageFromPanel() {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      showNotification('Extension was updated. Please refresh the page.', 'error');
      return;
    }

    // Check if we're on a valid page
    if (window.location.protocol === 'chrome:' ||
      window.location.protocol === 'chrome-extension:' ||
      window.location.protocol === 'edge:' ||
      window.location.protocol === 'about:') {
      showNotification('Cannot save browser internal pages', 'error');
      return;
    }

    const saveBtn = sidePanel.querySelector('.panel-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const scrapedData = scrapePage();

    // Get current user
    const userResponse = await chrome.runtime.sendMessage({ action: 'getAuthUser' });
    const user = userResponse?.user;

    if (!user) {
      showNotification('Please sign in to save memories', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save This Page';
      return;
    }

    // Extract enhanced fields from scraped metadata
    const metadata = scrapedData.metadata || {};
    const detectedType = metadata.detectedType || 'page';
    const category = metadata.category || 'general';
    const subcategory = metadata.subcategory || '';

    const memoryData = {
      id: Date.now(),
      user_id: user.id,
      url: window.location.href,
      page_title: metadata.title || document.title,
      title: metadata.title || document.title,
      selected_text: scrapedData.scrapedText,
      content: scrapedData.fullContent || scrapedData.scrapedText,
      content_type: detectedType,

      // Basic metadata
      domain: metadata.domain || window.location.hostname,
      favicon: getFavicon(),
      description: metadata.description || '',
      author: metadata.author || '',
      published_date: metadata.publishedDate || null,
      language: metadata.language || 'en',

      // Rich content
      main_image: metadata.mainImage || '',
      images: JSON.stringify(metadata.images || []),
      headings: JSON.stringify(metadata.headings || []),
      keywords: metadata.keywords || '',

      // Reading info
      reading_time: metadata.readingTime || '',
      word_count: metadata.wordCount || 0,

      // Product info
      price: metadata.price || null,
      currency: metadata.currency || null,
      availability: metadata.availability || null,
      rating: metadata.rating || null,
      brand: metadata.brand || null,

      // Video info
      video_platform: metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].type : null,
      video_timestamp: metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].currentTime : null,
      video_duration: metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].duration : null,
      video_url: metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].url : null,
      thumbnail_url: metadata.videos && metadata.videos.length > 0 ? (metadata.videos[0].thumbnail || metadata.mainImage) : null,

      // Categorization
      category: category,
      subcategory: subcategory,
      status: 'to_read',

      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scraped_at: new Date().toISOString()
    };

    // Save to API via background script
    const apiResponse = await chrome.runtime.sendMessage({
      action: 'saveMemoryToAPI',
      data: memoryData
    });

    if (!apiResponse || !apiResponse.success) {
      throw new Error(apiResponse?.error || 'Failed to save to server');
    }

    // Also save to local storage via background script
    const memories = await getMemoriesFromStorage();
    memories.unshift(memoryData);

    const storageUserResponse = await chrome.runtime.sendMessage({ action: 'getAuthUser' });
    const userId = storageUserResponse?.user?.id;
    const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;

    await chrome.runtime.sendMessage({
      action: 'setToStorage',
      key: storageKey,
      value: memories
    });

    await loadMemoriesIntoPanel();
    showNotification('Saved to your memories!', 'success');

    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      Save This Page
    `;
  } catch (error) {
    console.error('Error saving page:', error);

    const saveBtn = sidePanel?.querySelector('.panel-save-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Save This Page
      `;
    }

    if (error.message?.includes('Extension context invalidated')) {
      showNotification('Extension was updated. Please refresh the page.', 'error');
    } else {
      showNotification('Failed to save: ' + (error.message || 'Unknown error'), 'error');
    }
  }
}

// Delete memory from panel
async function deleteMemoryFromPanel(id) {
  if (!confirm('Delete this memory?')) return;

  try {
    const memories = await getMemoriesFromStorage();
    const filtered = memories.filter(m => m.id !== id);

    // Get storage key for current user
    const userResponse = await chrome.runtime.sendMessage({ action: 'getAuthUser' });
    const userId = userResponse?.user?.id;
    const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;

    await chrome.runtime.sendMessage({
      action: 'setToStorage',
      key: storageKey,
      value: filtered
    });

    await loadMemoriesIntoPanel();
    showNotification('Memory deleted', 'success');
  } catch (error) {
    console.error('Error deleting memory:', error);
    showNotification('Failed to delete memory', 'error');
  }
}

// Handle panel search
async function handlePanelSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const memories = await getMemoriesFromStorage();

  const filtered = memories.filter(memory =>
    memory.page_title?.toLowerCase().includes(searchTerm) ||
    memory.selected_text?.toLowerCase().includes(searchTerm) ||
    memory.url?.toLowerCase().includes(searchTerm)
  );

  displayMemoriesInPanel(filtered);
}

// Get favicon
function getFavicon() {
  const faviconLink = document.querySelector('link[rel*="icon"]');
  return faviconLink ? faviconLink.href : null;
}

// Initialize on page load with delay to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initFloatingStartButton, 1000);
  });
} else {
  setTimeout(initFloatingStartButton, 1000);
}

// Track text selection without showing button
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString().trim() : '';

  if (selectedText.length > 0 && selection && selection.rangeCount > 0) {
    try {
      lastSelection = {
        text: selectedText,
        range: selection.getRangeAt(0).cloneRange()
      };
    } catch (err) {
      console.warn('Selection range error:', err);
      lastSelection = null;
    }
  } else {
    lastSelection = null;
  }
});

// Show "Save to Memories" box only when user presses Ctrl+C (copy event)
document.addEventListener('copy', (e) => {
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString().trim() : '';

  if (selectedText.length > 0 && selection && selection.rangeCount > 0) {
    try {
      // Update lastSelection with current selection
      lastSelection = {
        text: selectedText,
        range: selection.getRangeAt(0).cloneRange()
      };

      console.log('[CopyEvent] Text copied, showing save button:', selectedText.substring(0, 50));

      // Show the floating save button after copy
      setTimeout(() => {
        showFloatingButton(selection);
      }, 100);
    } catch (err) {
      console.warn('Copy event error:', err);
    }
  }
});

// Show floating button for text selection
function showFloatingButton(selection) {
  hideFloatingButton();

  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  floatingButton = document.createElement('div');
  floatingButton.id = 'memory-capture-button';
  floatingButton.innerHTML = `
    <div class="memory-save-form">
      <div class="save-form-header">
        <h4>Save to Memories</h4>
        <button class="memory-close-btn" title="Close">×</button>
      </div>
      <div class="save-form-body">
        <div class="selected-text-preview"></div>
        <input type="text" class="tag-input" placeholder="Add tags (comma separated)" />
        <button class="memory-save-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save Memory
        </button>
      </div>
    </div>
  `;

  // Set text preview safely using textContent
  const previewDiv = floatingButton.querySelector('.selected-text-preview');
  if (previewDiv) {
    if (lastSelection && lastSelection.text) {
      const txt = String(lastSelection.text || '');
      const textPreview = txt.substring(0, 100) + (txt.length > 100 ? '...' : '');
      previewDiv.textContent = `"${textPreview}"`;
    } else {
      previewDiv.textContent = '"Selected text"';
    }
  }

  floatingButton.style.position = 'absolute';
  floatingButton.style.top = `${window.scrollY + rect.bottom + 10}px`;
  floatingButton.style.left = `${window.scrollX + rect.left}px`;
  floatingButton.style.zIndex = '2147483645';

  document.body.appendChild(floatingButton);

  // Stop propagation on the entire form - prevent mouseup from hiding the button
  floatingButton.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  floatingButton.addEventListener('mouseup', (e) => {
    e.stopPropagation();
  });

  floatingButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Save button click
  const saveBtnEl = floatingButton.querySelector('.memory-save-btn');
  if (saveBtnEl) {
    saveBtnEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      console.log('[FloatingButton] Save button clicked');

      if (!lastSelection || !lastSelection.text) {
        console.log('[FloatingButton] No text selected');
        showNotification('No text selected', 'error');
        hideFloatingButton();
        return;
      }

      console.log('[FloatingButton] Selected text:', lastSelection.text.substring(0, 100));

      // Disable button and show loading state
      saveBtnEl.disabled = true;
      const originalHTML = saveBtnEl.innerHTML;
      saveBtnEl.innerHTML = `
        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"></path>
        </svg>
        Saving...
      `;

      try {
        const tagInput = floatingButton.querySelector('.tag-input');
        const tags = tagInput.value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        console.log('[FloatingButton] Tags:', tags);
        console.log('[FloatingButton] Calling saveMemory...');

        await saveMemory({
          selected_text: lastSelection.text,
          url: window.location.href,
          page_title: document.title,
          content_type: 'text',
          tags: tags
        });

        console.log('[FloatingButton] saveMemory completed successfully');
        hideFloatingButton();
        window.getSelection().removeAllRanges();
      } catch (error) {
        console.error('[FloatingButton] Error in save button click:', error);
        showNotification('Failed to save: ' + (error.message || 'Unknown error'), 'error');

        // Re-enable button
        saveBtnEl.disabled = false;
        saveBtnEl.innerHTML = originalHTML;
      }
    });
  }

  // Close button click
  const closeBtnEl = floatingButton.querySelector('.memory-close-btn');
  if (closeBtnEl) {
    closeBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      hideFloatingButton();
    });
  }

  // Focus tag input
  setTimeout(() => {
    const tagInputEl = floatingButton.querySelector('.tag-input');
    if (tagInputEl) tagInputEl.focus();
  }, 100);
}

function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

// Function to detect and capture video information
function detectVideos() {
  const videos = [];

  // Detect HTML5 video elements
  document.querySelectorAll('video').forEach(video => {
    if (video.currentSrc || video.src) {
      videos.push({
        type: 'html5',
        src: video.currentSrc || video.src,
        currentTime: video.currentTime,
        duration: video.duration,
        paused: video.paused,
        title: video.title || document.title
      });
    }
  });

  // Detect YouTube videos
  const ytPlayer = document.querySelector('video.html5-main-video');
  if (ytPlayer) {
    const videoId = new URLSearchParams(window.location.search).get('v');
    videos.push({
      type: 'youtube',
      videoId: videoId,
      currentTime: ytPlayer.currentTime,
      duration: ytPlayer.duration,
      paused: ytPlayer.paused,
      url: window.location.href,
      title: document.title
    });
  }

  // Detect Vimeo
  if (window.location.hostname.includes('vimeo.com')) {
    const vimeoPlayer = document.querySelector('video');
    if (vimeoPlayer) {
      videos.push({
        type: 'vimeo',
        currentTime: vimeoPlayer.currentTime,
        duration: vimeoPlayer.duration,
        url: window.location.href,
        title: document.title
      });
    }
  }

  return videos;
}

// Function to scrape page content with enhanced media detection
function scrapePage() {
  try {
    // Get main content - try to find article content first
    let mainContent = '';
    const articleSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content'
    ];

    let contentElement = null;
    for (const selector of articleSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    mainContent = contentElement ? contentElement.innerText.trim() : document.body.innerText.trim();
    const bodyText = document.body.innerText.trim();

    // Get comprehensive meta tags
    const metaDesc = document.querySelector('meta[name="description"]')?.content ||
      document.querySelector('meta[property="og:description"]')?.content || '';
    const metaTitle = document.querySelector('meta[property="og:title"]')?.content || document.title;
    const metaImage = document.querySelector('meta[property="og:image"]')?.content || '';
    const author = document.querySelector('meta[name="author"]')?.content ||
      document.querySelector('[rel="author"]')?.innerText?.trim() || '';
    const publishedDate = document.querySelector('meta[property="article:published_time"]')?.content ||
      document.querySelector('time[datetime]')?.getAttribute('datetime') || '';
    const keywords = document.querySelector('meta[name="keywords"]')?.content || '';

    // Get all headings with hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
      .map(h => ({
        level: h.tagName,
        text: h.innerText.trim()
      }))
      .filter(h => h.text.length > 0)
      .slice(0, 15);

    // Enhanced image extraction with better filtering
    const images = Array.from(document.querySelectorAll('img'))
      .map(img => {
        const rect = img.getBoundingClientRect();
        return {
          src: img.src,
          alt: img.alt || '',
          title: img.title || '',
          width: img.naturalWidth || rect.width,
          height: img.naturalHeight || rect.height,
          isVisible: rect.width > 0 && rect.height > 0
        };
      })
      .filter(img => {
        // Filter out tracking pixels, icons, and data URIs
        if (!img.src || img.src.startsWith('data:')) return false;
        if (img.width < 100 || img.height < 100) return false; // Filter small images
        if (img.src.includes('tracking') || img.src.includes('pixel')) return false;
        return true;
      })
      .sort((a, b) => (b.width * b.height) - (a.width * a.height)) // Sort by size
      .slice(0, 10);

    // Find main/featured image
    const mainImage = metaImage ||
      (images.length > 0 ? images[0].src : '') ||
      document.querySelector('[property="og:image"]')?.content ||
      document.querySelector('img[class*="featured"]')?.src ||
      document.querySelector('img[class*="hero"]')?.src ||
      '';

    // Enhanced link extraction with context
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        title: a.title || '',
        isExternal: !a.href.startsWith(window.location.origin)
      }))
      .filter(link => link.text.length > 0 && link.text.length < 200)
      .slice(0, 30);

    // Detect videos with timestamps
    const videos = detectVideos();

    // Detect content type and category
    const detectedType = detectContentType();

    // Product detection
    const productInfo = detectProductInfo();

    // If we found strong product signals (like price), override content type
    if (productInfo.price || (productInfo.title && productInfo.brand)) {
      detectedType.type = 'product';
      detectedType.category = 'shopping';
      detectedType.subcategory = 'product';
    }

    // Get selected text if any
    const selectedText = window.getSelection().toString().trim();

    // Calculate reading time
    const wordCount = mainContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Extract language
    const language = document.documentElement.lang ||
      document.querySelector('meta[property="og:locale"]')?.content?.split('_')[0] ||
      'en';

    // Create enhanced summary
    const summary = mainContent.substring(0, 1000);

    return {
      scrapedText: selectedText || summary,
      fullContent: mainContent,
      metadata: {
        // Basic info
        title: metaTitle,
        description: metaDesc,
        domain: window.location.hostname,
        author: author,
        publishedDate: publishedDate,
        language: language,

        // Content structure
        headings: headings,
        wordCount: wordCount,
        readingTime: readingTime > 0 ? `${readingTime} min read` : '',
        keywords: keywords,

        // Media
        // Prioritize product image if available, otherwise use detected main image
        mainImage: productInfo.image || mainImage,
        images: images,
        videos: videos,

        // Links
        links: links,

        // Product info (if detected)
        ...productInfo,

        // Categorization
        detectedType: detectedType.type,
        category: detectedType.category,
        subcategory: detectedType.subcategory,

        // Timestamps
        timestamp: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error scraping page:', error);
    return {
      scrapedText: '',
      fullContent: '',
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Detect content type based on page content and URL
function detectContentType() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const bodyText = document.body.innerText.toLowerCase();

  // YouTube detection
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return { type: 'video', category: 'video', subcategory: 'youtube' };
  }

  // Vimeo detection
  if (url.includes('vimeo.com')) {
    return { type: 'video', category: 'video', subcategory: 'vimeo' };
  }

  // Shopping/Product detection
  if (url.includes('amazon.') || url.includes('ebay.') ||
    url.includes('shop') || url.includes('store') ||
    bodyText.includes('add to cart') || bodyText.includes('buy now') ||
    document.querySelector('[itemtype*="Product"]') ||
    document.querySelector('button[class*="cart"]') ||
    document.querySelector('.price') ||
    document.querySelector('[data-price]')) {
    return { type: 'product', category: 'shopping', subcategory: 'product' };
  }

  // Recipe detection
  if (title.includes('recipe') ||
    bodyText.includes('ingredients') && bodyText.includes('instructions') ||
    document.querySelector('[itemtype*="Recipe"]') ||
    bodyText.includes('prep time') || bodyText.includes('cook time')) {
    return { type: 'article', category: 'recipe', subcategory: 'cooking' };
  }

  // Tutorial/How-to detection
  if (title.includes('how to') || title.includes('tutorial') ||
    title.includes('guide') || bodyText.includes('step 1') ||
    bodyText.includes('step-by-step')) {
    return { type: 'article', category: 'tutorial', subcategory: 'guide' };
  }

  // News detection
  if (url.includes('news') ||
    document.querySelector('[itemtype*="NewsArticle"]') ||
    document.querySelector('time[datetime]')) {
    return { type: 'article', category: 'news', subcategory: 'article' };
  }

  // Blog detection
  if (url.includes('blog') ||
    document.querySelector('[itemtype*="BlogPosting"]') ||
    document.querySelector('.post') ||
    document.querySelector('article')) {
    return { type: 'article', category: 'blog', subcategory: 'post' };
  }

  // Research/Documentation
  if (url.includes('docs') || url.includes('documentation') ||
    url.includes('wiki') || title.includes('documentation')) {
    return { type: 'article', category: 'documentation', subcategory: 'reference' };
  }

  // Default to page
  return { type: 'page', category: 'general', subcategory: 'webpage' };
}

// Detect product information
function detectProductInfo() {
  const productInfo = {};

  try {
    // 1. Try JSON-LD (Most reliable for modern e-commerce)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        // Handle array of objects, single object, or graph
        const items = Array.isArray(data) ? data : (data['@graph'] || [data]);

        const product = items.find(item =>
          item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product'
        );

        if (product) {
          if (product.name) productInfo.title = product.name;
          if (product.image) {
            productInfo.image = Array.isArray(product.image) ? product.image[0] :
              (typeof product.image === 'object' ? product.image.url : product.image);
          }
          if (product.description) productInfo.description = product.description;
          if (product.brand) {
            productInfo.brand = typeof product.brand === 'object' ? product.brand.name : product.brand;
          }
          if (product.sku) productInfo.sku = product.sku;

          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            if (offer) {
              productInfo.price = offer.price;
              productInfo.currency = offer.priceCurrency;
              productInfo.availability = offer.availability;
              productInfo.url = offer.url;
            }
          }

          if (product.aggregateRating) {
            productInfo.rating = product.aggregateRating.ratingValue;
            productInfo.reviewCount = product.aggregateRating.reviewCount;
          }

          // If we found a product via JSON-LD, this is usually the best data
          return productInfo;
        }
      } catch (e) {
        // Continue to next script or method
      }
    }

    // 2. Try OpenGraph Product Tags
    const ogPrice = document.querySelector('meta[property="product:price:amount"]')?.content;
    const ogCurrency = document.querySelector('meta[property="product:price:currency"]')?.content;
    if (ogPrice) {
      productInfo.price = ogPrice;
      productInfo.currency = ogCurrency;
    }

    const ogBrand = document.querySelector('meta[property="product:brand"]')?.content;
    if (ogBrand) productInfo.brand = ogBrand;

    // 3. Try Schema.org Microdata (DOM attributes)
    const productSchema = document.querySelector('[itemtype*="Product"]');
    if (productSchema) {
      const priceEl = productSchema.querySelector('[itemprop="price"]');
      const currencyEl = productSchema.querySelector('[itemprop="priceCurrency"]');
      const availabilityEl = productSchema.querySelector('[itemprop="availability"]');
      const ratingEl = productSchema.querySelector('[itemprop="ratingValue"]');
      const brandEl = productSchema.querySelector('[itemprop="brand"]');
      const imageEl = productSchema.querySelector('[itemprop="image"]');

      if (priceEl && !productInfo.price) productInfo.price = priceEl.content || priceEl.innerText.trim();
      if (currencyEl && !productInfo.currency) productInfo.currency = currencyEl.content || currencyEl.innerText.trim();
      if (availabilityEl && !productInfo.availability) productInfo.availability = availabilityEl.content || availabilityEl.href || availabilityEl.innerText.trim();
      if (ratingEl && !productInfo.rating) productInfo.rating = ratingEl.content || ratingEl.innerText.trim();
      if (brandEl && !productInfo.brand) productInfo.brand = brandEl.content || brandEl.innerText.trim();
      if (imageEl && !productInfo.image) productInfo.image = imageEl.src || imageEl.content;
    }

    // 4. Site-Specific Fallbacks (Amazon, eBay, etc.)
    const hostname = window.location.hostname;

    // Amazon
    if (hostname.includes('amazon')) {
      const priceEl = document.querySelector('#priceblock_ourprice') ||
        document.querySelector('#priceblock_dealprice') ||
        document.querySelector('.a-price .a-offscreen');
      if (priceEl && !productInfo.price) productInfo.price = priceEl.innerText.trim();

      const titleEl = document.querySelector('#productTitle');
      if (titleEl && !productInfo.title) productInfo.title = titleEl.innerText.trim();

      const imgEl = document.querySelector('#landingImage') || document.querySelector('#imgBlkFront');
      if (imgEl && !productInfo.image) productInfo.image = imgEl.src;
    }

    // Generic Fallback Selectors (if still missing data)
    if (!productInfo.price) {
      const priceSelectors = [
        '.price', '[data-price]', '[class*="price"]', '#price',
        '.product-price', '.sale-price', '.current-price', '.amount'
      ];

      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        if (priceEl) {
          const priceText = priceEl.getAttribute('data-price') ||
            priceEl.getAttribute('content') ||
            priceEl.innerText.trim();
          // Basic regex to check if it looks like a price
          if (priceText && /[\$£€¥₹]?\s*\d+[.,]?\d*/.test(priceText)) {
            productInfo.price = priceText;
            break;
          }
        }
      }
    }

  } catch (error) {
    console.log('Error detecting product info:', error);
  }

  return productInfo;
}

// Quick capture function - captures current page context
async function quickCapture() {
  try {
    const scrapedData = scrapePage();
    const videos = scrapedData.metadata.videos || [];

    // Determine content type
    let contentType = 'page';
    let captureInfo = '';

    if (videos.length > 0) {
      contentType = 'video';
      const video = videos[0];
      const timestamp = formatTime(video.currentTime);
      captureInfo = `Video at ${timestamp}`;

      if (video.duration) {
        const duration = formatTime(video.duration);
        captureInfo += ` / ${duration}`;
      }
    }

    // Show quick capture dialog
    showQuickCaptureDialog({
      contentType,
      captureInfo,
      scrapedData,
      videos
    });
  } catch (error) {
    console.error('Error in quick capture:', error);
    showNotification('Capture failed', 'error');
  }
}

// Format time in MM:SS or HH:MM:SS
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

// Show quick capture dialog - Independent window
function showQuickCaptureDialog(data) {
  // Remove existing dialog
  const existing = document.getElementById('quick-capture-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.id = 'quick-capture-dialog';

  const videoInfo = data.videos && data.videos.length > 0 ? data.videos[0] : null;
  const isVideo = data.contentType === 'video';

  dialog.innerHTML = `
    <div class="quick-capture-content">
      <div class="capture-header">
        <h3>Quick Capture</h3>
        <button class="close-capture-btn">×</button>
      </div>

      <div class="capture-body">
        ${isVideo ? `
          <div class="video-info">
            <div class="video-icon">🎬</div>
            <div class="video-details">
              <strong>${videoInfo.title || 'Video'}</strong>
              <p>Timestamp: ${data.captureInfo}</p>
            </div>
          </div>
        ` : `
          <div class="page-info">
            <strong>${document.title}</strong>
            <p>${window.location.hostname}</p>
          </div>
        `}

        <textarea class="capture-note" placeholder="Add a note or description..." rows="3"></textarea>
        <input type="text" class="capture-tags" placeholder="Add tags (comma separated)" />

        <button class="save-capture-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save to Memories
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Stop propagation to prevent closing when clicking on dialog
  dialog.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Event listeners
  dialog.querySelector('.close-capture-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    dialog.remove();
  });

  dialog.querySelector('.save-capture-btn').addEventListener('click', async (e) => {
    e.stopPropagation();

    const note = dialog.querySelector('.capture-note').value;
    const tags = dialog.querySelector('.capture-tags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    await saveMemory({
      selected_text: note || data.scrapedData.scrapedText,
      url: window.location.href,
      page_title: document.title,
      content_type: data.contentType,
      tags: tags,
      video_info: videoInfo
    });

    dialog.remove();
  });

  // Focus note textarea
  setTimeout(() => {
    dialog.querySelector('.capture-note').focus();
  }, 100);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveMemory') {
    saveMemory(request.data);
  }

  if (request.action === 'showNotification') {
    showNotification(request.data.message, request.data.type || 'info');
  }

  if (request.action === 'scrapePage') {
    const scrapedData = scrapePage();
    sendResponse(scrapedData);
  }

  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
  }

  return true;
});

// Save memory to chrome.storage
async function saveMemory(data) {
  console.log('[saveMemory] Starting save with data:', data);

  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.error('[saveMemory] Extension context invalidated');
      const error = new Error('Extension context invalidated');
      showNotification('Extension was updated. Please refresh the page.', 'error');
      throw error;
    }

    // Check if we're on a valid page
    if (window.location.protocol === 'chrome:' ||
      window.location.protocol === 'chrome-extension:' ||
      window.location.protocol === 'edge:' ||
      window.location.protocol === 'about:') {
      console.error('[saveMemory] Invalid page protocol:', window.location.protocol);
      const error = new Error('Cannot save browser internal pages');
      showNotification('Cannot save browser internal pages', 'error');
      throw error;
    }

    showNotification('Verifying authentication...', 'info');

    // Verify session with backend before saving
    console.log('[saveMemory] Verifying authentication...');
    const authResponse = await chrome.runtime.sendMessage({ action: 'verifyAuth' });
    console.log('[saveMemory] Auth response:', authResponse);

    if (!authResponse?.authenticated || !authResponse?.user) {
      console.error('[saveMemory] Not authenticated');
      const error = new Error('User not authenticated');
      showNotification('Please sign in to save memories. Opening login page...', 'error');

      // Open login page after a short delay
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'openAuthPage' });
      }, 1500);
      throw error;
    }

    const user = authResponse.user;
    console.log('[saveMemory] User authenticated:', user.id);
    showNotification('Saving...', 'info');

    // Get favicon if not provided
    if (!data.favicon) {
      const faviconLink = document.querySelector('link[rel*="icon"]');
      data.favicon = faviconLink ? faviconLink.href : null;
    }

    // Scrape page metadata
    console.log('[saveMemory] Scraping page metadata...');
    const scrapedData = scrapePage();
    console.log('[saveMemory] Scraped data:', scrapedData);
    const metadata = scrapedData.metadata || {};
    const detectedType = metadata.detectedType || data.content_type || 'text';
    const category = metadata.category || 'general';
    const subcategory = metadata.subcategory || '';

    // Prepare enhanced memory data
    const memoryData = {
      id: Date.now(),
      url: window.location.href,
      page_title: metadata.title || document.title,
      title: metadata.title || document.title,
      selected_text: data.selected_text || scrapedData.scrapedText,
      content: scrapedData.fullContent || data.selected_text || scrapedData.scrapedText,
      content_type: detectedType,

      // Basic metadata
      domain: metadata.domain || window.location.hostname,
      favicon: data.favicon || metadata.mainImage,
      description: metadata.description || '',
      author: metadata.author || '',
      published_date: metadata.publishedDate || null,
      language: metadata.language || 'en',

      // Rich content
      main_image: metadata.mainImage || '',
      images: JSON.stringify(metadata.images || []),
      headings: JSON.stringify(metadata.headings || []),
      keywords: metadata.keywords || '',

      // Reading info
      reading_time: metadata.readingTime || '',
      word_count: metadata.wordCount || 0,

      // Product info
      price: metadata.price || null,
      currency: metadata.currency || null,
      availability: metadata.availability || null,
      rating: metadata.rating || null,
      brand: metadata.brand || null,

      // Video info
      video_platform: data.video_info?.type || (metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].type : null),
      video_timestamp: data.video_info?.currentTime || (metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].currentTime : null),
      video_duration: data.video_info?.duration || (metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].duration : null),
      video_url: data.video_info?.url || (metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].url : null),
      thumbnail_url: data.video_info?.thumbnail || metadata.mainImage || (metadata.videos && metadata.videos.length > 0 ? metadata.videos[0].thumbnail : null),

      // Categorization
      category: category,
      subcategory: subcategory,
      status: 'to_read',

      tags: data.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scraped_at: new Date().toISOString()
    };

    console.log('[saveMemory] Memory data prepared:', memoryData);

    // Save to API via background script
    console.log('[saveMemory] Sending to API...');
    const apiResponse = await chrome.runtime.sendMessage({
      action: 'saveMemoryToAPI',
      data: memoryData
    });
    console.log('[saveMemory] API response:', apiResponse);

    if (!apiResponse || !apiResponse.success) {
      const errorMsg = apiResponse?.error || 'Failed to save to server';
      console.error('[saveMemory] API error:', errorMsg);

      // Check if it's an authentication error
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('log in')) {
        showNotification('Please log in to save memories. Opening login page...', 'error');
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'openAuthPage' });
        }, 1500);
        return;
      }

      throw new Error(errorMsg);
    }

    // Also save to local storage via background script
    console.log('[saveMemory] Saving to local storage...');
    const memories = await getMemoriesFromStorage();
    memories.unshift(memoryData);

    const userId = user.id;
    const storageKey = `${STORAGE_KEY}_${userId}`;

    await chrome.runtime.sendMessage({
      action: 'setToStorage',
      key: storageKey,
      value: memories
    });
    console.log('[saveMemory] Saved to local storage');

    showNotification('Saved to your memories!', 'success');
    console.log('[saveMemory] Save completed successfully');

    // Refresh panel if open
    if (isPanelOpen && sidePanel) {
      await loadMemoriesIntoPanel();
    }
  } catch (error) {
    console.error('Error saving memory:', error);

    if (error.message?.includes('Extension context invalidated')) {
      showNotification('Extension was updated. Please refresh the page.', 'error');
    } else if (error.message?.includes('Cannot save browser internal pages')) {
      showNotification('Cannot save browser internal pages', 'error');
    } else if (error.message?.includes('Unauthorized') || error.message?.includes('log in')) {
      showNotification('Please log in to save memories', 'error');
    } else {
      showNotification('Failed to save: ' + (error.message || 'Unknown error'), 'error');
    }

    // Re-throw to let caller handle it
    throw error;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `memory-notification memory-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
