# PostgreSQL Setup Guide

This Go backend now uses PostgreSQL instead of MongoDB.

## Local Development Setup

### 1. Install PostgreSQL

#### Windows
- Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
- Or use Chocolatey: `choco install postgresql`

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Connect to PostgreSQL and create a database:

```bash
# Connect as postgres user
psql -U postgres

# Create database
CREATE DATABASE myapp_db;

# Create a user (optional)
CREATE USER myapp_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE myapp_db TO myapp_user;

# Exit
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the `api` directory:

```bash
POSTGRES_URI=postgres://postgres:postgres@localhost:5432/myapp_db?sslmode=disable
PORT=8080
```

Or if you created a custom user:

```bash
POSTGRES_URI=postgres://myapp_user:your_password@localhost:5432/myapp_db?sslmode=disable
PORT=8080
```

### 4. Install Go Dependencies

```bash
cd api
go mod download
```

### 5. Run the Application

```bash
go run main.go
```

The application will automatically create the necessary tables on startup.

## Database Schema

The `items` table structure:

```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Production Deployment

### Vercel with Vercel Postgres

1. Add Vercel Postgres to your project
2. Set the `POSTGRES_URI` environment variable in Vercel settings
3. Deploy your application

### Other PostgreSQL Providers

Compatible with:
- Supabase
- Railway
- Render
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- Heroku Postgres
- DigitalOcean Managed Databases

Just set the `POSTGRES_URI` environment variable with your connection string.

## Connection String Format

```
postgres://username:password@host:port/database?sslmode=mode
```

- `username`: PostgreSQL username
- `password`: PostgreSQL password
- `host`: Database host (e.g., localhost, or provider hostname)
- `port`: PostgreSQL port (default: 5432)
- `database`: Database name
- `sslmode`: SSL mode (disable, require, verify-ca, verify-full)

## Troubleshooting

### Connection Issues

1. Check if PostgreSQL is running:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Windows (in psql)
   \conninfo
   ```

2. Verify connection string format
3. Check firewall settings
4. Ensure database exists

### Migration Issues

If tables aren't created automatically, run the migration manually:

```bash
psql -U postgres -d myapp_db -f migrations/001_init.sql
```

## API Endpoints

The API endpoints remain the same:

- `POST /api/items` - Create item
- `GET /api/items` - Get all items (supports ?status= and ?priority= filters)
- `GET /api/items?id={id}` - Get item by ID
- `PUT /api/items?id={id}` - Update item
- `DELETE /api/items?id={id}` - Delete item

## Changes from MongoDB

- ID fields are now integers instead of ObjectID strings
- Timestamps are PostgreSQL TIMESTAMP type
- Added database indexes for better performance
- Connection pooling configured
- Tables auto-created on startup
