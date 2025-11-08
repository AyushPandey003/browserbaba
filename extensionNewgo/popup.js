/* global chrome */
// Popup script for Memory Capture Extension - Vanilla JavaScript

import authManager from './auth.js';

const STORAGE_KEY = 'memory_capture_data';

let memories = [];
let loading = true;
let error = null;
let searchTerm = '';
let currentUser = null;

// DOM Elements
const savePageBtn = document.getElementById('save-page-btn');
const saveBtnText = document.getElementById('save-btn-text');
const searchInput = document.getElementById('search-input');
const memoriesList = document.getElementById('memories-list');
const statsText = document.getElementById('stats-text');
const errorBanner = document.getElementById('error-banner');
const authSection = document.getElementById('auth-section');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const verifyBtn = document.getElementById('verify-btn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await authManager.init();
  setupEventListeners();
  setupAuthListeners();
  await checkAuthStatus();
});

function setupEventListeners() {
  savePageBtn.addEventListener('click', saveCurrentPage);
  searchInput.addEventListener('input', handleSearch);
}

function setupAuthListeners() {
  // Subscribe to auth state changes
  authManager.subscribe((user) => {
    currentUser = user;
    updateAuthUI();
    if (user) {
      loadMemories();
    }
  });

  loginBtn?.addEventListener('click', () => {
    authManager.openAuthPage();
  });

  logoutBtn?.addEventListener('click', async () => {
    await authManager.signOut();
    memories = [];
    renderMemories();
  });

  verifyBtn?.addEventListener('click', async () => {
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    await checkAuthStatus();
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify Session';
  });
}

async function checkAuthStatus() {
  const isAuthenticated = await authManager.verifySession();
  updateAuthUI();
  return isAuthenticated;
}

function updateAuthUI() {
  if (currentUser) {
    authSection?.classList.add('hidden');
    userInfo?.classList.remove('hidden');
    userName.textContent = currentUser.name || currentUser.email;
    savePageBtn.disabled = false;
  } else {
    authSection?.classList.remove('hidden');
    userInfo?.classList.add('hidden');
    savePageBtn.disabled = true;
  }
}

// Load memories from chrome.storage
async function loadMemories() {
  try {
    loading = true;
    error = null;
    renderMemories();

    if (!currentUser) {
      memories = [];
      loading = false;
      renderMemories();
      return;
    }

    // Load user-specific memories
    const userStorageKey = `${STORAGE_KEY}_${currentUser.id}`;
    const result = await chrome.storage.local.get(userStorageKey);
    memories = result[userStorageKey] || [];
    
    loading = false;
    updateStats();
    renderMemories();
  } catch (err) {
    console.error('Error loading memories:', err);
    error = 'Failed to load memories';
    loading = false;
    showError(error);
    renderMemories();
  }
}

// Update stats
function updateStats() {
  const count = memories.length;
  statsText.textContent = `${count} ${count === 1 ? 'memory' : 'memories'} saved`;
}

// Save current page
async function saveCurrentPage() {
  try {
    // Check authentication first
    if (!currentUser) {
      showError('Please log in to save memories');
      authManager.openAuthPage();
      return;
    }

    savePageBtn.disabled = true;
    saveBtnText.textContent = 'Saving...';
    hideError();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if URL is valid
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('data:')) {
      throw new Error('Cannot save browser internal pages');
    }

    // Get page content from content script if available
    let pageContent = '';
    let metadata = {};
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapePage' });
      if (response) {
        pageContent = response.scrapedText || '';
        metadata = response.metadata || {};
      }
    } catch (err) {
      console.log('Could not scrape page content:', err);
    }

    // Get favicon
    let favicon = null;
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
      favicon = tab.favIconUrl;
    }

    const memoryData = {
      id: Date.now(),
      user_id: currentUser.id, // Add user ID
      url: tab.url,
      page_title: tab.title || 'Untitled',
      title: tab.title || 'Untitled',
      content_type: 'page',
      selected_text: pageContent.substring(0, 500),
      content: pageContent,
      favicon: favicon,
      tags: [],
      metadata: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to API via background script
    const response = await chrome.runtime.sendMessage({
      action: 'saveMemoryToAPI',
      data: memoryData
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to save to server');
    }

    // Also save to local storage for offline access (user-specific key)
    const userStorageKey = `${STORAGE_KEY}_${currentUser.id}`;
    memories.unshift(memoryData);
    await chrome.storage.local.set({ [userStorageKey]: memories });

    // Notify content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        data: { message: 'Saved to your memories!', type: 'success' }
      });
    } catch (e) {
      // Content script might not be loaded
    }

    await loadMemories();
    
    savePageBtn.disabled = false;
    saveBtnText.textContent = 'Saved! ✓';
    
    setTimeout(() => {
      saveBtnText.textContent = 'Save This Page';
    }, 2000);

  } catch (err) {
    console.error('Error saving page:', err);
    const errorMsg = err.message || 'Failed to save page';
    showError(errorMsg);
    
    savePageBtn.disabled = false;
    saveBtnText.textContent = 'Save This Page';
  }
}

// Delete memory
async function deleteMemory(id) {
  if (!confirm('Delete this memory?')) return;

  try {
    if (!currentUser) return;
    
    const userStorageKey = `${STORAGE_KEY}_${currentUser.id}`;
    memories = memories.filter(m => m.id !== id);
    await chrome.storage.local.set({ [userStorageKey]: memories });
    await loadMemories();
  } catch (err) {
    console.error('Error deleting memory:', err);
    showError('Failed to delete memory');
  }
}

// Open memory URL
function openMemory(url) {
  chrome.tabs.create({ url });
}

// Handle search
function handleSearch(e) {
  searchTerm = e.target.value.toLowerCase();
  renderMemories();
}

// Render memories
function renderMemories() {
  if (loading) {
    memoriesList.innerHTML = '<div class="loading">Loading memories...</div>';
    return;
  }

  if (error) {
    memoriesList.innerHTML = `
      <div class="empty-state">
        <p>Error loading memories</p>
        <p class="hint">${escapeHtml(error)}</p>
      </div>
    `;
    return;
  }

  // Filter memories by search term
  const filteredMemories = memories.filter(memory =>
    memory.page_title?.toLowerCase().includes(searchTerm) ||
    memory.selected_text?.toLowerCase().includes(searchTerm) ||
    memory.url?.toLowerCase().includes(searchTerm) ||
    memory.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );

  if (filteredMemories.length === 0) {
    memoriesList.innerHTML = `
      <div class="empty-state">
        <p>${searchTerm ? 'No memories found' : 'No memories yet'}</p>
        <p class="hint">${searchTerm ? 'Try a different search term' : 'Save this page to get started'}</p>
      </div>
    `;
    return;
  }

  memoriesList.innerHTML = filteredMemories.map(memory => createMemoryCard(memory)).join('');

  // Add event listeners
  filteredMemories.forEach(memory => {
    const card = document.querySelector(`.memory-card[data-id="${memory.id}"]`);
    if (!card) return;

    const deleteBtn = card.querySelector('.memory-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMemory(memory.id);
      });
    }

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.memory-delete-btn')) {
        openMemory(memory.url);
      }
    });
  });
}

// Create memory card HTML
function createMemoryCard(memory) {
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
    ? `<p class="memory-text">${escapeHtml(safeMemory.selected_text.substring(0, 100))}${safeMemory.selected_text.length > 100 ? '...' : ''}</p>`
    : '';

  const tagsHtml = safeMemory.tags.length > 0
    ? `<div class="memory-tags">${safeMemory.tags.map(tag => `<span class="memory-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';

  const urlDisplay = getUrlDisplay(safeMemory.url);

  return `
    <div class="memory-card" data-id="${safeMemory.id}">
      <div class="memory-header">
        ${safeMemory.favicon ? `<img src="${safeMemory.favicon}" alt="" class="memory-favicon">` : ''}
        <div class="memory-meta">
          <h3 class="memory-title">${escapeHtml(safeMemory.page_title)}</h3>
          <span class="memory-time">${formatDate(safeMemory.created_at)}</span>
        </div>
        <button class="memory-delete-btn" title="Delete">×</button>
      </div>
      ${textPreview}
      ${tagsHtml}
      <div class="memory-footer">
        <span class="memory-type">${safeMemory.content_type}</span>
        <span class="memory-url" title="${escapeHtml(safeMemory.url)}">${escapeHtml(urlDisplay)}</span>
      </div>
    </div>
  `;
}

// Get URL display (domain only)
function getUrlDisplay(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.substring(0, 30) + '...';
  }
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

// Show error
function showError(message) {
  error = message;
  errorBanner.textContent = message;
  errorBanner.style.display = 'block';
}

// Hide error
function hideError() {
  error = null;
  errorBanner.style.display = 'none';
}
