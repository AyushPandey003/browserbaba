# Running BrowseBaba Backend

## Quick Start

### 1. Start the Backend Server

**Option A: Using the batch script (Windows)**
```bash
cd api
run-local.bat
```

**Option B: Manual command**
```bash
cd api
go run main.go
```

The server will start on `http://localhost:8000`

### 2. Verify the Server is Running

Open your browser and go to: http://localhost:8000/health

You should see:
```json
{
  "success": true,
  "message": "BrowseBaba API is running",
  "version": "2.0.0",
  ...
}
```

### 3. Use the Extension

1. Open Chrome/Edge and load the extension from `extension` folder
2. Click the extension icon
3. The API URL should already be set to `http://localhost:8000`
4. Navigate to any webpage
5. Select text and right-click → "Save Selection to BrowseBaba"
6. Or watch a video and right-click → "Save Video Timestamp"

## Troubleshooting

### Error: "Failed to fetch" in Extension

**Cause:** Backend server is not running

**Solution:**
1. Open a terminal in the `api` folder
2. Run: `go run main.go`
3. You should see: "🚀 BrowseBaba Backend starting on http://localhost:8000"
4. Keep this terminal window open while using the extension

### Error: "found packages handler and main"

**Cause:** Go is trying to compile both `index.go` (Vercel deployment) and `main.go` (local development)

**Solution:** Always specify the file to run:
```bash
go run main.go
```

NOT:
```bash
go run .
go run *.go
```

### Database Connection Error

**Cause:** PostgreSQL is not running or database doesn't exist

**Solution:**
1. Make sure PostgreSQL is installed and running
2. Create the database:
   ```bash
   psql -U postgres
   CREATE DATABASE browsebaba;
   \q
   ```
3. Update connection string in `config/database.go` if needed:
   ```go
   connStr := "host=localhost port=5432 user=postgres password=yourpassword dbname=browsebaba sslmode=disable"
   ```

### Port Already in Use

**Cause:** Another application is using port 8000

**Solution:**

**Option 1:** Stop the other application

**Option 2:** Change the port
1. Set environment variable:
   ```bash
   set PORT=8080
   go run main.go
   ```
2. Update extension API URL to match: `http://localhost:8080`

### CORS Errors

**Cause:** Browser is blocking cross-origin requests

**Solution:** This shouldn't happen with the extension, but if it does:
1. Check that `middleware/cors.go` has:
   ```go
   w.Header().Set("Access-Control-Allow-Origin", "*")
   ```
2. Restart the backend server

## Development Notes

### File Structure
```
api/
├── main.go              # Local development server (port 8000)
├── index.go             # Vercel serverless function
├── run-local.bat        # Quick start script
├── config/
│   └── database.go      # Database connection
├── controllers/
│   ├── memory_controller.go  # Main controller (NEW)
│   └── item_controller.go    # Old controller (legacy)
├── models/
│   └── item.go          # Data models
├── middleware/
│   ├── cors.go
│   ├── logger.go
│   └── validator.go
└── routes/
    └── routes.go        # API routes
```

### Main vs Index
- **main.go**: For local development with `go run main.go`
- **index.go**: For Vercel serverless deployment
- Both use the same controllers, models, and routes
- Keep both in sync

### Testing Endpoints

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Save Memory:**
```bash
curl -X POST http://localhost:8000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "Test Memory",
    "content_type": "page",
    "content": "Test content",
    "tags": ["test"],
    "scraped_at": "2024-01-01T00:00:00Z"
  }'
```

**Get All Memories:**
```bash
curl http://localhost:8000/api/memories
```

**Search Memories:**
```bash
curl -X POST http://localhost:8000/api/memories/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "limit": 10
  }'
```

**Get Stats:**
```bash
curl http://localhost:8000/api/memories/stats
```

### Hot Reload

For development with automatic reloading, install Air:
```bash
go install github.com/cosmtrek/air@latest
```

Then run:
```bash
air
```

### Building for Production

```bash
# Build binary
go build -o browsebaba-server main.go

# Run binary
./browsebaba-server  # Linux/Mac
browsebaba-server.exe  # Windows
```

### Environment Variables

```bash
# Port (default: 8000)
set PORT=8000

# Database (configure in config/database.go)
# Example connection string:
# "host=localhost port=5432 user=postgres password=pass dbname=browsebaba sslmode=disable"
```

## Deployment

### Local Development
```bash
cd api
go run main.go
```

### Vercel (Serverless)
```bash
# Already configured in vercel.json at project root
vercel deploy
```

### Traditional Server
```bash
# Build
cd api
go build -o server main.go

# Run
./server
```

### Docker (Optional)
Create `api/Dockerfile`:
```dockerfile
FROM golang:1.21-alpine

WORKDIR /app
COPY . .

RUN go mod download
RUN go build -o server main.go

EXPOSE 8000
CMD ["./server"]
```

Build and run:
```bash
docker build -t browsebaba-backend .
docker run -p 8000:8000 browsebaba-backend
```

## Next Steps

1. ✅ Backend is running
2. ✅ Database is connected
3. ✅ Extension is loaded
4. 🔄 Test saving content from websites
5. 🔄 Test video bookmarks on YouTube
6. 🔄 Test search functionality

## Support

If you encounter issues:
1. Check the terminal for error messages
2. Check browser console (F12) for extension errors
3. Verify PostgreSQL is running
4. Verify port 8000 is available
5. Check `MIGRATION_GUIDE.md` for detailed API documentation
