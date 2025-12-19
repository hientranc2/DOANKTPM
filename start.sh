#!/bin/bash

echo "🚀 Starting E-commerce Docker deployment..."

# Start docker services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 8

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ All services started successfully!"
    echo ""
    echo "📱 Opening applications..."
    echo "   Frontend: http://localhost:3000"
    echo "   Admin: http://localhost:5173"
    echo "   API: http://localhost:4000"
    echo ""
    
    # Open in browser (macOS)
    if command -v open &> /dev/null; then
        open http://localhost:3000
        sleep 2
        open http://localhost:5173
    # Open in browser (Linux)
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000 &
        sleep 2
        xdg-open http://localhost:5173 &
    # Open in browser (Windows)
    elif command -v start &> /dev/null; then
        start http://localhost:3000
        sleep 2
        start http://localhost:5173
    fi
    
    echo ""
    echo "💡 Tips:"
    echo "   - View logs: docker-compose logs -f [service-name]"
    echo "   - Stop services: docker-compose down"
    echo "   - Database: psql -h localhost -p 5433 -U postgres -d clothify"
else
    echo "❌ Failed to start services"
    exit 1
fi
