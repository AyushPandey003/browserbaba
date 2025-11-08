@echo off
REM Setup script for PostgreSQL database

echo ===================================
echo PostgreSQL Database Setup
echo ===================================
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Set database variables
set DB_NAME=myapp_db
set DB_USER=postgres
set /p DB_USER="Enter PostgreSQL username [postgres]: " || set DB_USER=postgres

echo.
echo Creating database: %DB_NAME%
echo.

REM Create database using psql
psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo Database created successfully!
) else (
    echo Database may already exist or there was an error.
    echo Continuing anyway...
)

echo.
echo Running migrations...
echo.

REM Run migration script
psql -U %DB_USER% -d %DB_NAME% -f migrations\001_init.sql

if %ERRORLEVEL% EQU 0 (
    echo Migrations completed successfully!
) else (
    echo There was an error running migrations.
    echo Please check the error messages above.
)

echo.
echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Create a .env file in the api directory
echo 2. Add: POSTGRES_URI=postgres://%DB_USER%:YOUR_PASSWORD@localhost:5432/%DB_NAME%?sslmode=disable
echo 3. Run: go mod tidy
echo 4. Run: go run main.go
echo.
pause
