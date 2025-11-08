// Background service worker for the extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Web Content Scraper extension installed');

    // Create context menu items
    chrome.contextMenus.create({
        id: 'saveSelection',
        title: 'Save selected text',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'saveSelectionWithVideo',
        title: 'Save with video timestamp',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'saveVideoTimestamp',
        title: 'Save current video timestamp',
        contexts: ['page', 'video']
    });

    chrome.contextMenus.create({
        id: 'savePage',
        title: 'Save entire page',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'quickHighlight',
        title: 'Highlight selection',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case 'saveSelection':
            await handleSaveSelection(info, tab, false);
            break;
        case 'saveSelectionWithVideo':
            await handleSaveSelection(info, tab, true);
            break;
        case 'saveVideoTimestamp':
            await handleSaveVideoTimestamp(tab);
            break;
        case 'savePage':
            await handleSavePage(tab);
            break;
        case 'quickHighlight':
            await handleQuickHighlight(tab);
            break;
    }
});

async function handleSaveSelection(info, tab, includeVideo) {
    try {
        const config = await chrome.storage.sync.get(['apiUrl']);
        const apiUrl = config.apiUrl || 'http://localhost:8000';

        // Get selection context
        const [contextResult] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return window.getSelectionWithContext ? window.getSelectionWithContext() : {
                    selectedText: window.getSelection().toString()
                };
            }
        });

        const selectionData = contextResult.result;

        // Get video timestamp if requested
        let videoData = null;
        if (includeVideo) {
            const [videoResult] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    return window.getVideoTimestamp ? window.getVideoTimestamp() : { hasVideo: false };
                }
            });
            videoData = videoResult.result;
        }

        const dataToSend = {
            url: tab.url,
            title: tab.title,
            content_type: 'selection',
            content: selectionData.selectedText || info.selectionText,
            selected_text: selectionData.selectedText || info.selectionText,
            context_before: selectionData.beforeContext || '',
            context_after: selectionData.afterContext || '',
            full_context: selectionData.fullContext || '',
            element_type: selectionData.elementType || '',
            page_section: selectionData.pageSection || '',
            xpath: selectionData.xpath || '',
            links: [],
            tags: [],
            notes: includeVideo && videoData?.hasVideo ? 
                `Saved from ${videoData.platform} at ${formatTimestamp(videoData.timestamp)}` : 
                'Saved via context menu',
            video_data: videoData && videoData.hasVideo ? {
                platform: videoData.platform,
                timestamp: videoData.timestamp,
                duration: videoData.duration,
                video_title: videoData.videoTitle,
                video_url: videoData.videoUrl,
                thumbnail_url: videoData.thumbnailUrl,
                formatted_timestamp: formatTimestamp(videoData.timestamp)
            } : null,
            scraped_at: new Date().toISOString()
        };

        const response = await fetch(`${apiUrl}/api/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
            // Highlight the saved text
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    if (window.highlightSelectedText) {
                        window.highlightSelectedText();
                    }
                }
            });

            // Show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Content Saved',
                message: videoData?.hasVideo ? 
                    `Saved with timestamp: ${formatTimestamp(videoData.timestamp)}` : 
                    'Selected text saved successfully!'
            });
        }
    } catch (error) {
        console.error('Error saving selection:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Error',
            message: 'Failed to save content: ' + error.message
        });
    }
}

async function handleSaveVideoTimestamp(tab) {
    try {
        const config = await chrome.storage.sync.get(['apiUrl']);
        const apiUrl = config.apiUrl || 'http://localhost:8000';

        // Get video timestamp
        const [videoResult] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return window.getVideoTimestamp ? window.getVideoTimestamp() : { hasVideo: false };
            }
        });

        const videoData = videoResult.result;

        if (!videoData.hasVideo) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'No Video Found',
                message: 'Could not detect a video on this page.'
            });
            return;
        }

        const dataToSend = {
            url: tab.url,
            title: tab.title,
            content_type: 'video_timestamp',
            content: `${videoData.videoTitle || tab.title} at ${formatTimestamp(videoData.timestamp)}`,
            selected_text: '',
            links: [],
            tags: ['video', videoData.platform.toLowerCase()],
            notes: `Video bookmark at ${formatTimestamp(videoData.timestamp)}`,
            video_data: {
                platform: videoData.platform,
                timestamp: videoData.timestamp,
                duration: videoData.duration,
                video_title: videoData.videoTitle,
                video_url: videoData.videoUrl,
                thumbnail_url: videoData.thumbnailUrl,
                formatted_timestamp: formatTimestamp(videoData.timestamp)
            },
            scraped_at: new Date().toISOString()
        };

        const response = await fetch(`${apiUrl}/api/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Video Bookmark Saved',
                message: `Saved at ${formatTimestamp(videoData.timestamp)}`
            });
        }
    } catch (error) {
        console.error('Error saving video timestamp:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Error',
            message: 'Failed to save video timestamp: ' + error.message
        });
    }
}

async function handleQuickHighlight(tab) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                if (window.highlightSelectedText) {
                    window.highlightSelectedText();
                }
            }
        });

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Text Highlighted',
            message: 'Selection has been highlighted'
        });
    } catch (error) {
        console.error('Error highlighting:', error);
    }
}

async function handleSavePage(tab) {
    try {
        const config = await chrome.storage.sync.get(['apiUrl']);
        const apiUrl = config.apiUrl || 'http://localhost:8000';

        // Get page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText
        });

        const content = results[0].result;

        // Check for video
        const [videoResult] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return window.getVideoTimestamp ? window.getVideoTimestamp() : { hasVideo: false };
            }
        });

        const videoData = videoResult.result;

        const dataToSend = {
            url: tab.url,
            title: tab.title,
            content_type: 'page',
            content: content,
            selected_text: '',
            links: [],
            tags: videoData.hasVideo ? ['page', videoData.platform.toLowerCase()] : ['page'],
            notes: 'Saved via context menu',
            video_data: videoData.hasVideo ? {
                platform: videoData.platform,
                timestamp: videoData.timestamp,
                duration: videoData.duration,
                video_title: videoData.videoTitle,
                video_url: videoData.videoUrl,
                thumbnail_url: videoData.thumbnailUrl,
                formatted_timestamp: formatTimestamp(videoData.timestamp)
            } : null,
            scraped_at: new Date().toISOString()
        };

        const response = await fetch(`${apiUrl}/api/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Content Saved',
                message: 'Page content saved successfully!'
            });
        }
    } catch (error) {
        console.error('Error saving page:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Error',
            message: 'Failed to save content: ' + error.message
        });
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'testConnection') {
        testBackendConnection(request.apiUrl)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function testBackendConnection(apiUrl) {
    try {
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
            return { success: true };
        }
        return { success: false, error: 'Backend not responding' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Helper function to format timestamp
function formatTimestamp(seconds) {
    if (!seconds && seconds !== 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
