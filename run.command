#!/bin/bash
cd "$(dirname "$0")"

# Function to find an available port
find_port() {
    local port=$1
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; do
        port=$((port + 1))
    done
    echo $port
}

PORT=$(find_port 8000)

echo "Starting Portfolio Website local server on port $PORT..."
echo "Opening http://localhost:$PORT in your browser..."

# Open browser in background after a short delay to let server start
(sleep 1 && open "http://localhost:$PORT") &

python3 -m http.server $PORT
