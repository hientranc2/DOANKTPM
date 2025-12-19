#!/bin/bash

echo "🔄 Database Migration Tool"
echo "=========================="
echo ""
echo "Bạn muốn:"
echo "1. Dump dữ liệu từ staging (pgAdmin4)"
echo "2. Restore dữ liệu vào Docker"
echo "3. Xóa tất cả dữ liệu Docker"
echo ""
read -p "Chọn (1/2/3): " choice

case $choice in
  1)
    echo ""
    echo "📤 Dumping dữ liệu từ staging..."
    read -p "Host pgAdmin4 (default: localhost): " PG_HOST
    PG_HOST=${PG_HOST:-localhost}
    read -p "Port (default: 5432): " PG_PORT
    PG_PORT=${PG_PORT:-5432}
    read -p "Username (default: postgres): " PG_USER
    PG_USER=${PG_USER:-postgres}
    read -p "Database (default: clothify): " PG_DB
    PG_DB=${PG_DB:-clothify}
    read -sp "Password: " PG_PASS
    echo ""
    
    # Dump data to SQL file
    DUMP_FILE="staging_dump_$(date +%Y%m%d_%H%M%S).sql"
    PGPASSWORD=$PG_PASS pg_dump -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB > "$DUMP_FILE"
    
    if [ $? -eq 0 ]; then
      echo "✅ Dump thành công: $DUMP_FILE"
    else
      echo "❌ Dump thất bại"
      exit 1
    fi
    ;;
    
  2)
    echo ""
    echo "📥 Restore dữ liệu vào Docker..."
    read -p "Chọn file dump (mặc định: staging_dump_*.sql mới nhất): " DUMP_FILE
    
    if [ -z "$DUMP_FILE" ]; then
      DUMP_FILE=$(ls -t staging_dump_*.sql 2>/dev/null | head -1)
    fi
    
    if [ ! -f "$DUMP_FILE" ]; then
      echo "❌ File không tìm thấy: $DUMP_FILE"
      exit 1
    fi
    
    echo "📄 Đang restore từ $DUMP_FILE..."
    docker-compose exec -T db psql -U postgres -d clothify < "$DUMP_FILE"
    
    if [ $? -eq 0 ]; then
      echo "✅ Restore thành công!"
      echo "🔄 Refresh backend..."
      docker-compose restart backend
    else
      echo "❌ Restore thất bại"
      exit 1
    fi
    ;;
    
  3)
    echo ""
    read -p "⚠️  Bạn chắc chắn muốn xóa tất cả dữ liệu Docker? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
      echo "🗑️  Xóa volumes..."
      docker-compose down -v
      docker-compose up -d
      echo "✅ Dữ liệu đã xóa, database reset về mặc định"
    fi
    ;;
    
  *)
    echo "❌ Lựa chọn không hợp lệ"
    exit 1
    ;;
esac
