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
  const memories = await getMemoriesFromStorage();
  updatePanelStats(memories);
  displayMemoriesInPanel(memories);
}

// Get memories from chrome.storage via background script
async function getMemoriesFromStorage() {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated, returning empty array');
      return [];
    }

    // Get current user first
    const userResponse = await chrome.runtime.sendMessage({ action: 'getAuthUser' });
    const userId = userResponse?.user?.id;
    
    const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    
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

    const memoryData = {
      id: Date.now(),
      user_id: user.id,
      url: window.location.href,
      page_title: document.title,
      title: document.title,
      selected_text: scrapedData.scrapedText,
      content: scrapedData.scrapedText,
      content_type: 'page',
      favicon: getFavicon(),
      metadata: scrapedData.metadata,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

// Text selection handler
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString().trim() : '';

  if (selectedText.length > 0 && selection && selection.rangeCount > 0) {
    try {
      lastSelection = {
        text: selectedText,
        range: selection.getRangeAt(0).cloneRange()
      };
      showFloatingButton(selection);
    } catch (err) {
      console.warn('Selection range error:', err);
      hideFloatingButton();
      lastSelection = null;
    }
  } else {
    hideFloatingButton();
    lastSelection = null;
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

  // Stop propagation on the entire form
  floatingButton.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Save button click
  const saveBtnEl = floatingButton.querySelector('.memory-save-btn');
  if (saveBtnEl) {
    saveBtnEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!lastSelection || !lastSelection.text) {
        showNotification('No text selected', 'error');
        hideFloatingButton();
        return;
      }

      const tagInput = floatingButton.querySelector('.tag-input');
      const tags = tagInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await saveMemory({
        selected_text: lastSelection.text,
        url: window.location.href,
        page_title: document.title,
        content_type: 'text',
        tags: tags
      });
      hideFloatingButton();
      window.getSelection().removeAllRanges();
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
    // Get main content
    const bodyText = document.body.innerText.trim();

    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';

    // Get all headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.innerText.trim())
      .filter(text => text.length > 0);

    // Get all images
    const images = Array.from(document.querySelectorAll('img'))
      .map(img => ({
        src: img.src,
        alt: img.alt || '',
        title: img.title || ''
      }))
      .filter(img => img.src && !img.src.startsWith('data:'))
      .slice(0, 10);

    // Get all links
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({
        text: a.innerText.trim(),
        href: a.href
      }))
      .filter(link => link.text.length > 0)
      .slice(0, 20);

    // Detect videos with timestamps
    const videos = detectVideos();

    // Get selected text if any
    const selectedText = window.getSelection().toString().trim();

    // Create a summary
    const summary = bodyText.substring(0, 500);

    return {
      scrapedText: selectedText || summary,
      metadata: {
        description: metaDesc,
        headings: headings.slice(0, 10),
        images: images,
        links: links,
        videos: videos,
        wordCount: bodyText.split(/\s+/).length,
        timestamp: new Date().toISOString(),
        domain: window.location.hostname
      }
    };
  } catch (error) {
    console.error('Error scraping page:', error);
    return {
      scrapedText: '',
      metadata: { error: error.message }
    };
  }
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

    showNotification('Verifying authentication...', 'info');

    // Verify session with backend before saving
    const authResponse = await chrome.runtime.sendMessage({ action: 'verifyAuth' });
    
    if (!authResponse?.authenticated || !authResponse?.user) {
      showNotification('Please sign in to save memories. Opening login page...', 'error');
      
      // Open login page after a short delay
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'openAuthPage' });
      }, 1500);
      return;
    }

    const user = authResponse.user;
    showNotification('Saving...', 'info');

    // Get favicon if not provided
    if (!data.favicon) {
      const faviconLink = document.querySelector('link[rel*="icon"]');
      data.favicon = faviconLink ? faviconLink.href : null;
    }

    // Scrape page metadata
    const scrapedData = scrapePage();

    // Prepare memory data (without user_id as it will be determined by session)
    const memoryData = {
      id: Date.now(),
      url: window.location.href,
      page_title: document.title,
      title: document.title,
      selected_text: data.selected_text || scrapedData.scrapedText,
      content: data.selected_text || scrapedData.scrapedText,
      content_type: data.content_type || 'text',
      favicon: data.favicon,
      tags: data.tags || [],
      video_info: data.video_info || null,
      metadata: {
        ...scrapedData.metadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to API via background script
    const apiResponse = await chrome.runtime.sendMessage({
      action: 'saveMemoryToAPI',
      data: memoryData
    });

    if (!apiResponse || !apiResponse.success) {
      const errorMsg = apiResponse?.error || 'Failed to save to server';
      
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
    const memories = await getMemoriesFromStorage();
    memories.unshift(memoryData);
    
    const userId = user.id;
    const storageKey = `${STORAGE_KEY}_${userId}`;
    
    await chrome.runtime.sendMessage({
      action: 'setToStorage',
      key: storageKey,
      value: memories
    });

    showNotification('Saved to your memories!', 'success');

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
