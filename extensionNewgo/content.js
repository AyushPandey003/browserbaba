// Content script that runs on all pages
// This can be used for additional functionality like highlighting saved content

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        sendResponse({
            title: document.title,
            url: window.location.href,
            content: document.body.innerText,
            html: document.body.innerHTML
        });
    }

    if (request.action === 'highlightSelection') {
        highlightSelectedText();
        sendResponse({ success: true });
    }

    if (request.action === 'getVideoTimestamp') {
        const videoData = getVideoTimestamp();
        sendResponse(videoData);
    }

    if (request.action === 'getSelectionContext') {
        const selectionData = getSelectionWithContext();
        sendResponse(selectionData);
    }

    return true;
});

function highlightSelectedText() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.backgroundColor = '#ffeb3b';
        span.style.padding = '2px';
        span.classList.add('browsebaba-highlight');
        span.setAttribute('data-saved-at', new Date().toISOString());
        try {
            range.surroundContents(span);
        } catch (e) {
            // Fallback if surroundContents fails
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
        }
    }
}

// Get video timestamp from various video platforms
function getVideoTimestamp() {
    const result = {
        hasVideo: false,
        platform: null,
        timestamp: null,
        duration: null,
        videoTitle: null,
        videoUrl: null,
        thumbnailUrl: null
    };

    // YouTube detection
    const youtubeVideo = document.querySelector('video.html5-main-video');
    if (youtubeVideo) {
        result.hasVideo = true;
        result.platform = 'YouTube';
        result.timestamp = Math.floor(youtubeVideo.currentTime);
        result.duration = Math.floor(youtubeVideo.duration);
        result.videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title')?.textContent?.trim();
        
        // Extract video ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        if (videoId) {
            result.videoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${result.timestamp}`;
            result.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        return result;
    }

    // Vimeo detection
    const vimeoPlayer = document.querySelector('iframe[src*="vimeo.com"]');
    if (vimeoPlayer) {
        result.hasVideo = true;
        result.platform = 'Vimeo';
        result.videoTitle = document.title;
        result.videoUrl = window.location.href;
        return result;
    }

    // Generic HTML5 video detection
    const genericVideo = document.querySelector('video');
    if (genericVideo && genericVideo.duration > 0) {
        result.hasVideo = true;
        result.platform = 'HTML5 Video';
        result.timestamp = Math.floor(genericVideo.currentTime);
        result.duration = Math.floor(genericVideo.duration);
        result.videoTitle = document.title;
        result.videoUrl = window.location.href;
        return result;
    }

    // Netflix detection
    if (window.location.hostname.includes('netflix.com')) {
        const netflixVideo = document.querySelector('video');
        if (netflixVideo) {
            result.hasVideo = true;
            result.platform = 'Netflix';
            result.timestamp = Math.floor(netflixVideo.currentTime);
            result.duration = Math.floor(netflixVideo.duration);
            result.videoTitle = document.querySelector('.video-title')?.textContent?.trim() || document.title;
            result.videoUrl = window.location.href;
            return result;
        }
    }

    // Twitch detection
    if (window.location.hostname.includes('twitch.tv')) {
        const twitchVideo = document.querySelector('video');
        if (twitchVideo) {
            result.hasVideo = true;
            result.platform = 'Twitch';
            result.timestamp = Math.floor(twitchVideo.currentTime);
            result.duration = Math.floor(twitchVideo.duration);
            result.videoTitle = document.querySelector('h1[data-a-target="stream-title"]')?.textContent?.trim() || document.title;
            result.videoUrl = window.location.href;
            return result;
        }
    }

    return result;
}

// Get selected text with surrounding context
function getSelectionWithContext() {
    const selection = window.getSelection();
    const result = {
        selectedText: '',
        beforeContext: '',
        afterContext: '',
        fullContext: '',
        xpath: '',
        elementType: '',
        pageSection: ''
    };

    if (!selection || selection.rangeCount === 0) {
        return result;
    }

    result.selectedText = selection.toString().trim();
    
    if (!result.selectedText) {
        return result;
    }

    try {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

        // Get element type
        result.elementType = parentElement.tagName?.toLowerCase() || 'unknown';

        // Get XPath
        result.xpath = getXPath(parentElement);

        // Get page section (article, main, section, etc.)
        const closestSection = parentElement.closest('article, main, section, aside, nav, header, footer');
        result.pageSection = closestSection?.tagName?.toLowerCase() || 'body';

        // Get surrounding text context
        const fullText = parentElement.textContent || '';
        const selectedIndex = fullText.indexOf(result.selectedText);
        
        if (selectedIndex !== -1) {
            const contextLength = 200;
            const beforeStart = Math.max(0, selectedIndex - contextLength);
            const afterEnd = Math.min(fullText.length, selectedIndex + result.selectedText.length + contextLength);
            
            result.beforeContext = fullText.substring(beforeStart, selectedIndex).trim();
            result.afterContext = fullText.substring(selectedIndex + result.selectedText.length, afterEnd).trim();
            result.fullContext = fullText.substring(beforeStart, afterEnd).trim();
        }
    } catch (e) {
        console.error('Error getting selection context:', e);
    }

    return result;
}

// Generate XPath for an element
function getXPath(element) {
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }
    
    const parts = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = element.previousSibling;
        
        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }
        
        const tagName = element.nodeName.toLowerCase();
        const pathIndex = index ? `[${index + 1}]` : '';
        parts.unshift(tagName + pathIndex);
        
        element = element.parentNode;
    }
    
    return parts.length ? '/' + parts.join('/') : '';
}

// Add context menu support indicator
console.log('Web Content Scraper extension loaded');
