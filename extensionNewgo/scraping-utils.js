// Helper utility functions for content scraping
// Add this to content.js if needed

/**
 * Get favicon from page - tries multiple methods
 */
function getFavicon() {
  // Try various favicon methods
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];
  
  for (const selector of selectors) {
    const link = document.querySelector(selector);
    if (link && link.href) {
      return link.href;
    }
  }
  
  // Fallback to default favicon
  try {
    const url = new URL(window.location.href);
    return `${url.protocol}//${url.host}/favicon.ico`;
  } catch {
    return null;
  }
}

/**
 * Clean and normalize text content
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .trim();
}

/**
 * Extract structured data from Schema.org markup
 */
function extractSchemaData() {
  const schemas = [];
  const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
  
  scriptTags.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      schemas.push(data);
    } catch (e) {
      console.log('Failed to parse schema:', e);
    }
  });
  
  return schemas;
}

/**
 * Detect if page is a Single Page App
 */
function isSPA() {
  // Check for common SPA frameworks
  return !!(
    window.React ||
    window.Vue ||
    window.angular ||
    document.querySelector('[ng-app]') ||
    document.querySelector('[data-reactroot]') ||
    document.querySelector('[data-vue-app]')
  );
}

/**
 * Wait for dynamic content to load (for SPAs)
 */
async function waitForContent(selector, timeout = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Extract price from text using regex patterns
 */
function extractPriceFromText(text) {
  if (!text) return null;
  
  // Common price patterns
  const patterns = [
    /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,  // $1,234.56
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?USD/,  // 1234.56 USD
    /£\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,    // £1,234.56
    /€\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,    // €1,234.56
    /₹\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,    // ₹1,234.56
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Get color scheme of the page
 */
function getPageColorScheme() {
  const bodyStyle = window.getComputedStyle(document.body);
  const backgroundColor = bodyStyle.backgroundColor;
  const color = bodyStyle.color;
  
  return {
    background: backgroundColor,
    text: color,
    isDark: backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && 
            parseInt(backgroundColor.split(',')[0].split('(')[1]) < 128
  };
}

/**
 * Detect if user is reading an article
 */
function isUserReading() {
  // Check scroll position - if user has scrolled down significantly
  const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  
  // Check time on page (if available)
  const timeOnPage = performance.now();
  
  return scrollPercent > 10 && timeOnPage > 5000; // Scrolled >10% and >5 seconds
}

/**
 * Get reading position percentage
 */
function getReadingPosition() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return (scrollTop / scrollHeight) * 100;
}

/**
 * Extract table of contents from headings
 */
function extractTableOfContents() {
  const headings = document.querySelectorAll('article h2, article h3, main h2, main h3');
  const toc = [];
  
  headings.forEach((heading, index) => {
    toc.push({
      level: parseInt(heading.tagName[1]),
      text: heading.textContent.trim(),
      id: heading.id || `heading-${index}`
    });
  });
  
  return toc;
}

/**
 * Check if content is behind paywall
 */
function detectPaywall() {
  const paywallIndicators = [
    'paywall',
    'subscription',
    'subscribe',
    'premium-content',
    'locked-content'
  ];
  
  return paywallIndicators.some(indicator => 
    document.querySelector(`[class*="${indicator}"]`) ||
    document.querySelector(`[id*="${indicator}"]`)
  );
}

/**
 * Get estimated article publication date from various sources
 */
function getPublicationDate() {
  // Try various selectors
  const selectors = [
    'time[datetime]',
    '[itemprop="datePublished"]',
    '[property="article:published_time"]',
    '.publish-date',
    '.publication-date',
    '.date'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const datetime = element.getAttribute('datetime') || 
                      element.getAttribute('content') ||
                      element.textContent;
      if (datetime) return datetime;
    }
  }
  
  return null;
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFavicon,
    cleanText,
    extractSchemaData,
    isSPA,
    waitForContent,
    extractPriceFromText,
    getPageColorScheme,
    isUserReading,
    getReadingPosition,
    extractTableOfContents,
    detectPaywall,
    getPublicationDate
  };
}
