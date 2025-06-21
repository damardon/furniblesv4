#!/bin/bash

echo "🚀 Starting Furnibles development environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting backend...${NC}"
cd backend && npm run start:dev &
BACKEND_PID=$!

echo -e "${BLUE}Waiting for backend to start...${NC}"
sleep 5

echo -e "${BLUE}Starting frontend...${NC}"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Development servers started!${NC}"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

chmod +x scripts/dev.sh