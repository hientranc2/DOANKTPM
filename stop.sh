#!/bin/bash

echo "🛑 Stopping E-commerce services..."
docker-compose down

echo "✅ All services stopped"
echo ""
echo "💡 To restart: ./start.sh"
