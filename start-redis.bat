@echo off
echo Starting Redis for Chess Competition...

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo Docker found, starting Redis container...
    docker run -d --name redis-chess -p 6379:6379 redis:latest
    echo Redis started on port 6379
    echo Test with: docker exec -it redis-chess redis-cli ping
) else (
    echo Docker not found. Please install Docker Desktop or Redis manually.
    echo.
    echo Options:
    echo 1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
    echo 2. Install Redis for Windows: https://github.com/microsoftarchive/redis/releases
    echo 3. Use WSL: wsl --install, then sudo apt install redis-server
)

pause