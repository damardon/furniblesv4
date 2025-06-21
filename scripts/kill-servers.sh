#!/bin/bash

echo "🛑 Stopping all Furnibles servers..."

# Kill processes on port 3001 (backend)
echo "Stopping backend (port 3001)..."
pkill -f "node.*3001" 2>/dev/null || echo "No backend process found"
pkill -f "npm run start:dev" 2>/dev/null || echo "No npm dev process found"

# Kill processes on port 3000 (frontend)
echo "Stopping frontend (port 3000)..."
pkill -f "next.*3000" 2>/dev/null || echo "No frontend process found"
pkill -f "npm run dev" 2>/dev/null || echo "No npm dev process found"

# Wait a moment
sleep 2

# Verify ports are free
echo "Checking ports..."
PORT_3001=$(lsof -ti :3001)
PORT_3000=$(lsof -ti :3000)

if [ -z "$PORT_3001" ]; then
    echo "✅ Port 3001 is free"
else
    echo "❌ Port 3001 still occupied by PID: $PORT_3001"
    kill -9 $PORT_3001 2>/dev/null
fi

if [ -z "$PORT_3000" ]; then
    echo "✅ Port 3000 is free"
else
    echo "❌ Port 3000 still occupied by PID: $PORT_3000"
    kill -9 $PORT_3000 2>/dev/null
fi

echo "🎉 All servers stopped!"
chmod +x scripts/kill-servers.sh