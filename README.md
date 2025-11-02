# Database Module

This module handles the database processing layer for the exchange system. It consumes trade data from Redis, stores it in PostgreSQL (with TimescaleDB), and maintains materialized views for candlestick (klines) data.

## Features

- **Redis Queue Consumer**: Processes trade messages from Redis queue (`db_processor`)
- **PostgreSQL Storage**: Stores trade data in TimescaleDB hypertables for efficient time-series queries
- **Materialized Views**: Automatically aggregates data into candlestick charts (1 minute, 1 hour, 1 week intervals)
- **View Refresh**: Cron job to periodically refresh materialized views

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.2.20+)
- PostgreSQL with [TimescaleDB](https://www.timescale.com/) extension
- Redis server

## Installation

```bash
bun install
```

## Configuration

Update the database connection settings in the source files:

- `src/index.ts` - Main database processor
- `src/cron.ts` - View refresh cron job
- `src/db-seed.ts` - Database initialization

Default connection settings:
```typescript
{
    user: 'your_user',
    host: 'localhost',
    database: 'my_database',
    password: 'your_password',
    port: 5432,
}
```

## Database Schema

### Table: `tata_prices`
- `time` - TIMESTAMP WITH TIME ZONE (primary time dimension)
- `price` - DOUBLE PRECISION
- `volume` - DOUBLE PRECISION
- `currency_code` - VARCHAR(10)

The table is created as a TimescaleDB hypertable for optimized time-series queries.

### Materialized Views

1. **klines_1m** - 1-minute candlestick data
2. **klines_1h** - 1-hour candlestick data
3. **klines_1w** - 1-week candlestick data

Each view contains:
- `bucket` - Time bucket
- `open` - Opening price
- `high` - Highest price
- `low` - Lowest price
- `close` - Closing price
- `volume` - Total volume
- `currency_code` - Currency code

## Scripts

### Development
```bash
bun run dev
```
Starts the main database processor that consumes messages from Redis.

### Production
```bash
bun run start
```
Same as `dev`, but for production use.

### Database Seeding
```bash
bun run seed:db
```
Initializes the database schema:
- Creates the `tata_prices` hypertable
- Creates materialized views for klines at different intervals

### Refresh Views
```bash
bun run refresh:views
```
Refreshes all materialized views. The cron job runs automatically every 10 seconds.

### Build
```bash
bun run build
```
Builds the project for production deployment.

## Architecture

### Message Processing

The module listens to Redis list `db_processor` and processes two types of messages:

1. **TRADE_ADDED**: New trade execution
   - Extracts price, volume, timestamp, and market from the message
   - Parses currency code from market string
   - Inserts into `tata_prices` table

2. **ORDER_UPDATE**: Order status updates (currently not processed)

### Data Flow

```
Exchange System → Redis Queue (db_processor) → Database Processor → PostgreSQL
                                                      ↓
                                           Materialized Views (klines)
                                                      ↓
                                              Cron Job (refresh every 10s)
```

## Types

The module defines the following message types (see `types.ts`):

- `DbMessage`: Union type for `TRADE_ADDED` and `ORDER_UPDATE` messages
- Trade data includes: id, isBuyerMaker, price, quantity, quoteQuantity, timestamp, market
- Order updates include: orderId, executedQty, market, price, quantity, side

## Notes

- The database processor runs in an infinite loop, continuously polling Redis
- Materialized views are refreshed every 10 seconds automatically
- Ensure TimescaleDB extension is installed in PostgreSQL before running `seed:db`
- Redis connection uses default settings (localhost:6379)

## Troubleshooting

- **Connection errors**: Verify PostgreSQL and Redis are running and credentials are correct
- **Hypertable errors**: Ensure TimescaleDB extension is installed: `CREATE EXTENSION IF NOT EXISTS timescaledb;`
- **View refresh errors**: Check that the base table `tata_prices` exists and has data
