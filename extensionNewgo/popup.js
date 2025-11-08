// Load saved configuration
document.addEventListener('DOMContentLoaded', async () => {
    // Load API URL from storage
    const config = await chrome.storage.sync.get(['apiUrl']);
    if (config.apiUrl) {
        document.getElementById('apiUrl').value = config.apiUrl;
    } else {
        document.getElementById('apiUrl').value = 'http://localhost:8000';
    }

    // Load current page info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        document.getElementById('currentUrl').textContent = tab.url;
        document.getElementById('currentTitle').textContent = tab.title;

        // Check for video on page
        await checkForVideo(tab);
    }

    // Load recent items
    loadRecentItems();

    // Set up event listeners
    setupEventListeners();
});

// Check if current page has video content
async function checkForVideo(tab) {
    try {
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return window.getVideoTimestamp ? window.getVideoTimestamp() : { hasVideo: false };
            }
        });

        const videoData = result.result;
        const videoInfo = document.getElementById('videoInfo');

        if (videoData.hasVideo) {
            videoInfo.style.display = 'block';
            document.getElementById('videoPlatform').textContent = videoData.platform;
            document.getElementById('videoTimestamp').textContent = formatTimestamp(videoData.timestamp);
            document.getElementById('videoDuration').textContent = formatTimestamp(videoData.duration);
            
            if (videoData.videoTitle) {
                document.getElementById('videoTitle').textContent = videoData.videoTitle;
            }

            // Show video bookmark button
            document.getElementById('saveVideoButton').style.display = 'block';
            document.getElementById('saveVideoButton').onclick = () => saveVideoBookmark(tab, videoData);
        } else {
            videoInfo.style.display = 'none';
            document.getElementById('saveVideoButton').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking for video:', error);
    }
}

// Save configuration
document.getElementById('saveConfig').addEventListener('click', async () => {
    const apiUrl = document.getElementById('apiUrl').value;
    await chrome.storage.sync.set({ apiUrl });
    showStatus('Configuration saved!', 'success');
});

async function saveVideoBookmark(tab, videoData) {
    const button = document.getElementById('saveVideoButton');
    button.disabled = true;
    button.textContent = 'Saving...';

    try {
        const config = await chrome.storage.sync.get(['apiUrl']);
        const apiUrl = config.apiUrl || 'http://localhost:8000';

        const dataToSend = {
            url: tab.url,
            title: tab.title,
            content_type: 'video_timestamp',
            content: `${videoData.videoTitle || tab.title} at ${formatTimestamp(videoData.timestamp)}`,
            selected_text: '',
            links: [],
            tags: ['video', videoData.platform.toLowerCase()],
            notes: document.getElementById('notes').value || `Video bookmark at ${formatTimestamp(videoData.timestamp)}`,
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await saveToRecent(dataToSend);
        document.getElementById('notes').value = '';
        showStatus('Video bookmark saved!', 'success');
        loadRecentItems();

    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Save Video Bookmark';
    }
}

function setupEventListeners() {
    // Content type change
    document.getElementById('contentType').addEventListener('change', (e) => {
        const customSelectorGroup = document.getElementById('customSelectorGroup');
        if (e.target.value === 'custom') {
            customSelectorGroup.style.display = 'block';
        } else {
            customSelectorGroup.style.display = 'none';
        }
    });

    // Scrape button
    document.getElementById('scrapeButton').addEventListener('click', scrapeAndSave);
}

async function scrapeAndSave() {
    const button = document.getElementById('scrapeButton');
    button.disabled = true;
    button.textContent = 'Saving...';

    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Get form values
        const contentType = document.getElementById('contentType').value;
        const customSelector = document.getElementById('customSelector').value;
        const tags = document.getElementById('tags').value;
        const notes = document.getElementById('notes').value;

        // Inject content script and get data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractContent,
            args: [contentType, customSelector]
        });

        const scrapedData = results[0].result;

        // Prepare data to send
        const dataToSend = {
            url: tab.url,
            title: tab.title,
            content_type: contentType,
            content: scrapedData.content,
            links: scrapedData.links || [],
            selected_text: scrapedData.selectedText || '',
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            notes: notes,
            scraped_at: new Date().toISOString()
        };

        // Add selection context if available
        if (scrapedData.selectionContext) {
            dataToSend.context_before = scrapedData.selectionContext.beforeContext;
            dataToSend.context_after = scrapedData.selectionContext.afterContext;
            dataToSend.full_context = scrapedData.selectionContext.fullContext;
            dataToSend.element_type = scrapedData.selectionContext.elementType;
            dataToSend.page_section = scrapedData.selectionContext.pageSection;
            dataToSend.xpath = scrapedData.selectionContext.xpath;
        }

        // Add video data if available
        if (scrapedData.videoData && scrapedData.videoData.hasVideo) {
            dataToSend.video_data = {
                platform: scrapedData.videoData.platform,
                timestamp: scrapedData.videoData.timestamp,
                duration: scrapedData.videoData.duration,
                video_title: scrapedData.videoData.videoTitle,
                video_url: scrapedData.videoData.videoUrl,
                thumbnail_url: scrapedData.videoData.thumbnailUrl,
                formatted_timestamp: formatTimestamp(scrapedData.videoData.timestamp)
            };
        }

        // Get API URL
        const config = await chrome.storage.sync.get(['apiUrl']);
        const apiUrl = config.apiUrl || 'http://localhost:8000';

        // Send to backend
        const response = await fetch(`${apiUrl}/api/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Save to local storage for recent items
        await saveToRecent(dataToSend);

        // Clear form
        document.getElementById('tags').value = '';
        document.getElementById('notes').value = '';

        showStatus('Content saved successfully!', 'success');
        loadRecentItems();

    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Save Content';
    }
}

// Function to inject into page
function extractContent(contentType, customSelector) {
    const result = {
        content: '',
        links: [],
        selectedText: '',
        selectionContext: null,
        videoData: null
    };

    // Get video data if available
    if (window.getVideoTimestamp) {
        result.videoData = window.getVideoTimestamp();
    }

    switch (contentType) {
        case 'page':
            result.content = document.body.innerText;
            break;

        case 'selection':
            if (window.getSelectionWithContext) {
                result.selectionContext = window.getSelectionWithContext();
                result.selectedText = result.selectionContext.selectedText;
                result.content = result.selectedText;
            } else {
                const selection = window.getSelection();
                result.selectedText = selection.toString();
                result.content = result.selectedText;
            }
            break;

        case 'links':
            const links = document.querySelectorAll('a');
            result.links = Array.from(links).map(link => ({
                text: link.textContent.trim(),
                href: link.href,
                title: link.title
            }));
            result.content = JSON.stringify(result.links, null, 2);
            break;

        case 'custom':
            if (customSelector) {
                const elements = document.querySelectorAll(customSelector);
                result.content = Array.from(elements)
                    .map(el => el.innerText)
                    .join('\n\n');
            }
            break;
    }

    return result;
}

async function saveToRecent(data) {
    const recent = await chrome.storage.local.get(['recentItems']);
    let recentItems = recent.recentItems || [];

    // Add new item to beginning
    recentItems.unshift({
        title: data.title,
        url: data.url,
        timestamp: Date.now()
    });

    // Keep only last 10 items
    recentItems = recentItems.slice(0, 10);

    await chrome.storage.local.set({ recentItems });
}

async function loadRecentItems() {
    const recent = await chrome.storage.local.get(['recentItems']);
    const recentItems = recent.recentItems || [];

    const container = document.getElementById('recentItems');

    if (recentItems.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 12px;">No recent items</p>';
        return;
    }

    container.innerHTML = recentItems.map(item => `
        <div class="recent-item">
            <div class="item-title">${escapeHtml(item.title)}</div>
            <div class="item-url">${escapeHtml(item.url)}</div>
            <div class="item-time">${formatTime(item.timestamp)}</div>
        </div>
    `).join('');
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;

    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
}

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
