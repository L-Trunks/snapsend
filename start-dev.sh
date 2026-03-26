#!/bin/bash
# SnapSend 本地开发启动脚本 (Linux/macOS)

echo -e "\033[36mStarting SnapSend development servers...\033[0m"

cd "$(dirname "$0")"

# Backend
cd backend
CONFIG_PATH=../config.yaml uvicorn app.main:app --reload --port 8080 &
BACKEND_PID=$!
echo -e "\033[32mBackend started (PID $BACKEND_PID) at http://localhost:8080\033[0m"
echo -e "\033[90mAPI docs: http://localhost:8080/api/docs\033[0m"

sleep 2

# Frontend
cd ../frontend
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev &
FRONTEND_PID=$!
echo -e "\033[32mFrontend started (PID $FRONTEND_PID) at http://localhost:3000\033[0m"

echo ""
echo "Press Ctrl+C to stop all servers"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" SIGINT SIGTERM
wait
