# BrowseBaba Browser Extension

A powerful browser extension for saving and organizing web content, with special support for video timestamps and smart text selection.

## ✨ Features

### 📝 Text Capture
- **Smart Selection**: Save any selected text with surrounding context
- **Context Preservation**: Automatically captures text before and after selection for better understanding
- **Element Tracking**: Records the HTML element type and page section where text was found
- **XPath Storage**: Saves the exact location of selected text for future reference

### 🎥 Video Support
- **Multi-Platform Detection**: Automatically detects videos on:
  - YouTube
  - Vimeo
  - Netflix
  - Twitch
  - Generic HTML5 videos
  
- **Timestamp Capture**: Save the exact moment in a video
- **Video Bookmarks**: Create bookmarks with timestamps for easy navigation
- **Thumbnail Capture**: Automatically saves video thumbnails (YouTube)
- **Duration Tracking**: Records total video duration and current position

### 🎨 Highlighting
- **Visual Feedback**: Highlights saved text selections on the page
- **Persistent Markers**: Highlighted text remains visible during your browsing session
- **Quick Highlight**: Right-click to highlight without saving

### 📋 Content Saving Options
1. **Selected Text**: Save highlighted text with full context
2. **Selected Text + Video**: Save selection with video timestamp
3. **Video Bookmark**: Save current video position
4. **Entire Page**: Save full page content
5. **All Links**: Extract and save all links on page
6. **Custom Selector**: Use CSS selectors for precise content extraction

## 🚀 Installation

### Chrome/Edge
1. Clone this repository or download the extension folder
2. Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `extension` folder

### Firefox
1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the extension folder and select `manifest.json`

## ⚙️ Configuration

1. Click the extension icon in your browser toolbar
2. The extension is configured to use: `https://browserbaba.vercel.app`
3. Log in through the extension to start saving content

## 📖 Usage

### Quick Save via Context Menu
1. **Select text** on any webpage
2. **Right-click** and choose:
   - "Save selected text" - Basic text save
   - "Save with video timestamp" - Include video time (if on video page)
   - "Highlight selection" - Highlight without saving

### Video Bookmarks
1. Navigate to a video (YouTube, Vimeo, etc.)
2. Pause at the moment you want to save
3. Click the extension icon
4. Click "📌 Save Video Bookmark"
5. Or right-click → "Save current video timestamp"

### Using the Popup Interface
1. Click the extension icon
2. Select what to save:
   - **Entire Page**: Full page content
   - **Selected Text**: Currently selected text with context
   - **All Links**: Extract all links
   - **Custom Selector**: Use CSS selector (e.g., `.article-content`)
3. Add tags (comma-separated): `research, important, video`
4. Add notes about the content
5. Click "Save Content"

## 🎯 Context Menu Options

### For Selected Text
- **Save selected text**: Quick save with context
- **Save with video timestamp**: Save selection + video position
- **Highlight selection**: Visual highlight only

### For Pages
- **Save entire page**: Capture full page content
- **Save current video timestamp**: Create video bookmark

## 📊 Data Captured

### Text Selection
```json
{
  "selected_text": "The actual selected text",
  "context_before": "Text before selection...",
  "context_after": "Text after selection...",
  "element_type": "p",
  "page_section": "article",
  "xpath": "/html/body/main/article[1]/p[3]"
}
```

### Video Bookmark
```json
{
  "video_data": {
    "platform": "YouTube",
    "timestamp": 125,
    "duration": 600,
    "formatted_timestamp": "2:05",
    "video_title": "Tutorial Video",
    "video_url": "https://youtube.com/watch?v=xyz&t=125",
    "thumbnail_url": "https://img.youtube.com/vi/xyz/maxresdefault.jpg"
  }
}
```

## 🎨 Visual Indicators

- **Yellow Highlight**: Saved text selections
- **Purple Badge**: Video detected on current page
- **Success Notifications**: Confirmation when content is saved
- **Video Info Card**: Shows video details in popup

## 🔧 Advanced Features

### Custom CSS Selectors
Extract specific parts of a page using CSS selectors:
- `.article-content` - Main article content
- `#main-text` - Element with specific ID
- `.card .title` - Nested elements
- `div[data-type="content"]` - Attribute selectors

### Recent Items
- View last 10 saved items
- See timestamps and URLs
- Quick reference to saved content

## 🛠️ Development

### File Structure
```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── background.js      # Background service worker
├── content.js         # Content script (page injection)
├── styles.css         # Popup styles
└── icons/            # Extension icons
```

### Key Functions

#### content.js
- `getVideoTimestamp()` - Detect and capture video data
- `getSelectionWithContext()` - Capture text with context
- `highlightSelectedText()` - Visual highlighting
- `getXPath()` - Generate element XPath

#### background.js
- `handleSaveSelection()` - Save selected text
- `handleSaveVideoTimestamp()` - Save video bookmark
- `formatTimestamp()` - Convert seconds to HH:MM:SS

## 🔌 API Integration

The extension sends data to your backend API:

**Endpoint**: `POST /api/scrape`

**Headers**: 
```
Content-Type: application/json
```

**Payload**:
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "content_type": "selection|page|video_timestamp",
  "content": "Main content text",
  "selected_text": "Selected portion",
  "context_before": "Text before...",
  "context_after": "Text after...",
  "video_data": { /* video info */ },
  "tags": ["tag1", "tag2"],
  "notes": "User notes",
  "scraped_at": "2024-01-01T12:00:00Z"
}
```

## 🎓 Tips & Tricks

1. **Quick Highlights**: Use the context menu "Highlight selection" to mark text without saving
2. **Video Navigation**: Save multiple timestamps to create a table of contents for videos
3. **Context Matters**: The extension captures surrounding text to help you remember why you saved something
4. **Tag Organization**: Use consistent tags like `research`, `quote`, `reference` for better organization
5. **Custom Selectors**: Learn basic CSS selectors to extract exactly what you need

## 🐛 Troubleshooting

### Extension not detecting videos
- Refresh the page after installing the extension
- Some platforms use custom video players that may not be detected
- Check browser console for errors (F12 → Console)

### Saved text not highlighting
- Some websites prevent content modification
- Try using "Save selected text" instead of "Highlight selection"

### Backend connection failed
- Verify your API URL is correct
- Ensure your backend server is running
- Check CORS settings on your backend

## 📝 Changelog

### Version 1.1.0
- ✨ Added video timestamp capture for YouTube, Vimeo, Netflix, Twitch
- ✨ Smart text selection with context preservation
- ✨ Visual highlighting of saved text
- ✨ Video bookmark feature
- ✨ XPath generation for selected elements
- ✨ Improved context menu options
- 🎨 Enhanced UI with video detection indicator

### Version 1.0.0
- Initial release
- Basic content scraping
- Link extraction
- Custom CSS selectors

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🤝 Contributing

Contributions welcome! Please feel free to submit pull requests or open issues.

## 🌟 Support

If you find this extension helpful, please star the repository!
