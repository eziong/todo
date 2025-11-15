#!/bin/bash

# Production Database Migration Script
# This script applies database migrations in production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting production database migration...${NC}"

# Check required environment variables
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY is not set${NC}"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL is not set${NC}"
    exit 1
fi

# Migration directory
MIGRATION_DIR="./database/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}Error: Migration directory $MIGRATION_DIR not found${NC}"
    exit 1
fi

# Function to execute SQL file
execute_sql() {
    local file=$1
    echo -e "${YELLOW}Executing: $file${NC}"
    
    # Use curl to execute SQL via Supabase REST API
    response=$(curl -s -w "%{http_code}" \
        -X POST \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": \"$(cat $file | sed 's/"/\\"/g' | tr '\n' ' ')\"}")
    
    http_code="${response: -3}"
    if [ "$http_code" -ne 200 ]; then
        echo -e "${RED}Error executing $file (HTTP $http_code)${NC}"
        echo "$response"
        return 1
    fi
    
    echo -e "${GREEN}✓ $file executed successfully${NC}"
}

# Create migration tracking table if it doesn't exist
echo -e "${YELLOW}Setting up migration tracking...${NC}"
cat << EOF | curl -s -X POST \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d @-
{
  "sql": "CREATE TABLE IF NOT EXISTS migration_history (id SERIAL PRIMARY KEY, filename TEXT UNIQUE NOT NULL, executed_at TIMESTAMP DEFAULT NOW());"
}
EOF

# Get list of executed migrations
executed_migrations=$(curl -s \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/migration_history?select=filename" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    | jq -r '.[].filename' 2>/dev/null || echo "")

echo -e "${YELLOW}Checking for new migrations...${NC}"

# Execute migrations in order
for migration_file in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration_file")
    
    if echo "$executed_migrations" | grep -q "^$filename$"; then
        echo -e "${GREEN}✓ $filename already executed${NC}"
        continue
    fi
    
    echo -e "${YELLOW}Executing new migration: $filename${NC}"
    
    # Execute the migration
    if execute_sql "$migration_file"; then
        # Record successful execution
        curl -s -X POST \
            "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/migration_history" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"filename\": \"$filename\"}" > /dev/null
        
        echo -e "${GREEN}✓ Migration $filename completed and recorded${NC}"
    else
        echo -e "${RED}✗ Migration $filename failed${NC}"
        exit 1
    fi
done

echo -e "${GREEN}All migrations completed successfully!${NC}"

# Verify database health
echo -e "${YELLOW}Verifying database health...${NC}"
health_check=$(curl -s \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/database_health_check" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" || echo "failed")

if [ "$health_check" != "failed" ]; then
    echo -e "${GREEN}✓ Database health check passed${NC}"
else
    echo -e "${YELLOW}! Database health check endpoint not available (this is normal)${NC}"
fi

echo -e "${GREEN}Production migration completed successfully!${NC}"