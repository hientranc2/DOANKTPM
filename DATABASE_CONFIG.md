# Docker Database Configuration Guide

## Mode 1: Use Local PostgreSQL (Default)
```bash
# In .env file, set:
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=clothify
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123123

# Then run:
./start.sh
```

## Mode 2: Use External Staging Database
```bash
# In .env file, set:
POSTGRES_HOST=your-staging-db-host.com
POSTGRES_PORT=5432
POSTGRES_DB=clothify
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password

# Then run:
./start.sh
```

## Example Staging Configuration
```bash
# pgAdmin4 hosted on cloud
POSTGRES_HOST=db.example.com
POSTGRES_PORT=5432
POSTGRES_DB=clothify
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Abcd1234!

NODE_ENV=production
JWT_SECRET=secret_ecom
```

## Steps to Connect to Staging DB

1. **Get database credentials from your hosting provider** (e.g., pgAdmin4)
2. **Update `.env` file** with the credentials
3. **Make sure staging DB is accessible** from your network
4. **Run Docker**:
   ```bash
   ./start.sh
   ```
5. **Check backend logs**:
   ```bash
   docker-compose logs backend
   ```

## Troubleshooting

### Connection refused
- Check if staging DB host is correct
- Verify firewall allows connection from your IP
- Test connection: `psql -h HOST -p PORT -U USERNAME -d DATABASE`

### Wrong password
- Double-check credentials in `.env`
- Reload: `./start.sh`

### Database not found
- Verify database name matches
- Check if schema tables exist in staging DB
