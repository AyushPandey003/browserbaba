/* global chrome */
// Background service worker for Memory Capture Extension

import authManager from './auth.js';

const API_BASE_URL = 'https://browserbaba.vercel.app/api';

// Initialize auth manager on install/startup
chrome.runtime.onInstalled.addListener(async () => {
  await authManager.init();
  
  // Create context menu for text selection
  chrome.contextMenus.create({
    id: 'save-selected-text',
    title: 'Save to Memories',
    contexts: ['selection']
  });

  // Create context menu for images
  chrome.contextMenus.create({
    id: 'save-image',
    title: 'Save Image to Memories',
    contexts: ['image']
  });

  // Create context menu for links
  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save Link to Memories',
    contexts: ['link']
  });

  // Create context menu for page
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save Page to Memories',
    contexts: ['page']
  });

  console.log('Memory Capture extension installed');
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await authManager.init();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // Check authentication by verifying session with backend
    const isAuthenticated = await authManager.verifySession();
    
    if (!isAuthenticated) {
      // Open auth page
      authManager.openAuthPage();
      
      // Try to send notification to content script
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          data: { message: 'Please log in to save memories', type: 'error' }
        }).catch(() => {});
      } catch (e) {
        // Silently fail
      }
      return;
    }

    // Check if URL is valid
    const url = tab.url || info.pageUrl;
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('edge://') || url.startsWith('about:')) {
      console.log('Cannot save browser internal pages');
      return;
    }

    let memoryData = {
      url: url,
      title: tab.title || 'Untitled',
      content_type: 'page',
      selected_text: '',
      tags: [],
      scraped_at: new Date().toISOString()
    };

    if (info.menuItemId === 'save-selected-text') {
      memoryData.selected_text = info.selectionText;
      memoryData.content_type = 'text';
    } else if (info.menuItemId === 'save-image') {
      memoryData.content_type = 'image';
      memoryData.selected_text = info.srcUrl;
      memoryData.content = info.srcUrl;
    } else if (info.menuItemId === 'save-link') {
      memoryData.selected_text = info.linkUrl;
      memoryData.content_type = 'link';
      memoryData.content = info.linkUrl;
    } else if (info.menuItemId === 'save-page') {
      memoryData.content_type = 'page';
    }

    // Save to API
    await saveMemoryToAPI(memoryData);

    // Try to send notification to content script
    try {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        data: { message: 'Saved to memories!', type: 'success' }
      }).catch(() => {
        console.log('Content script not available for notification');
      });
    } catch (e) {
      // Silently fail
    }

  } catch (error) {
    console.error('Error handling context menu click:', error);
    
    // Try to show error notification
    try {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        data: { message: 'Failed to save: ' + error.message, type: 'error' }
      }).catch(() => {});
    } catch (e) {
      // Silently fail
    }
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-selection') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) return;

    // Check authentication by verifying session with backend
    const isAuthenticated = await authManager.verifySession();
    
    if (!isAuthenticated) {
      authManager.openAuthPage();
      
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          data: { message: 'Please log in to save memories', type: 'error' }
        }).catch(() => {});
      } catch (e) {
        // Silently fail
      }
      return;
    }

    // Check if URL is valid
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    // Get selected text from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
      
      if (response && response.text) {
        const memoryData = {
          url: tab.url,
          title: tab.title,
          content_type: 'text',
          selected_text: response.text,
          tags: [],
          scraped_at: new Date().toISOString()
        };

        await saveMemoryToAPI(memoryData);
        
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          data: { message: 'Selection saved!', type: 'success' }
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          data: { message: 'Failed to save: ' + error.message, type: 'error' }
        }).catch(() => {});
      } catch (e) {
        // Silently fail
      }
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveMemoryToAPI') {
    saveMemoryToAPI(request.data)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Error saving to API:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getMemoriesFromAPI') {
    getMemoriesFromAPI(request.params)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Error fetching from API:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'deleteMemoryFromAPI') {
    deleteMemoryFromAPI(request.id)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Error deleting from API:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // Handle storage operations from content script
  if (request.action === 'getFromStorage') {
    chrome.storage.local.get(request.key)
      .then(result => {
        sendResponse({ success: true, data: result[request.key] });
      })
      .catch(error => {
        console.error('Error getting from storage:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'setToStorage') {
    chrome.storage.local.set({ [request.key]: request.value })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error setting to storage:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'getAuthUser') {
    const user = authManager.getUser();
    sendResponse({ success: true, user: user });
    return true;
  }

  if (request.action === 'verifyAuth') {
    authManager.verifySession()
      .then(isAuthenticated => {
        const user = authManager.getUser();
        sendResponse({ success: true, authenticated: isAuthenticated, user: user });
      })
      .catch(error => {
        console.error('Error verifying auth:', error);
        sendResponse({ success: false, authenticated: false, user: null });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'openAuthPage') {
    authManager.openAuthPage();
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// Helper function to get cookies for API requests
async function getCookiesForAPI() {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: '.vercel.app'
    });

    const cookieHeader = cookies
      .filter(c => c.domain.includes('browserbaba') || c.domain.includes('vercel.app'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    return cookieHeader;
  } catch (error) {
    console.error('Error getting cookies:', error);
    return '';
  }
}

// API Functions
async function saveMemoryToAPI(data) {
  try {
    // Get cookies for authentication
    const cookieHeader = await getCookiesForAPI();

    // Transform data to match API format
    const payload = {
      title: data.title || data.page_title || 'Untitled',
      type: mapContentTypeToMemoryType(data.content_type),
      url: data.url,
      content: data.content || data.selected_text,
      metadata: data.metadata || {},
      source: 'extension',
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/capture`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save memory');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to API:', error);
    throw error;
  }
}

// Map extension content types to API memory types
function mapContentTypeToMemoryType(contentType) {
  const typeMap = {
    'page': 'article',
    'text': 'note',
    'image': 'article',
    'link': 'article',
    'video': 'video',
  };
  return typeMap[contentType] || 'note';
}

async function getMemoriesFromAPI(params = {}) {
  try {
    const cookieHeader = await getCookiesForAPI();
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/memories${queryString ? `?${queryString}` : ''}`;

    const headers = {};
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
      headers: headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch memories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from API:', error);
    throw error;
  }
}

async function deleteMemoryFromAPI(id) {
  try {
    const cookieHeader = await getCookiesForAPI();

    const headers = {};
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/memories?id=${id}`, {
      method: 'DELETE',
      headers: headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete memory');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting from API:', error);
    throw error;
  }
}
