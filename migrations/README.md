# Database Migrations

This directory contains database migrations for the MSRC Dashboard application. We use [db-migrate](https://db-migrate.readthedocs.io/en/latest/) to manage database schema changes.

## Available Migration Commands

### Running Migrations

To apply all pending migrations:

```bash
npx db-migrate up -e dev
```

To apply a specific migration:

```bash
npx db-migrate up:20250420005319 -e dev
```

### Reverting Migrations

To revert the most recent migration:

```bash
npx db-migrate down -e dev
```

To revert a specific migration:

```bash
npx db-migrate down:20250420005319 -e dev
```

### Creating New Migrations

To create a new migration with SQL files:

```bash
npx db-migrate create my-migration-name --sql-file
```

Then edit the generated SQL files in the `sqls` directory.

## Deploying to Production

When deploying to production, run:

```bash
npx db-migrate up -e production
```

Make sure to update the production database credentials in `database.json` before running this command.

## Migration Files

- **20250420005319-add-rtp-tables**: Creates tables for Right to Play functionality:
  - School output indicators
  - District output indicators
  - Consolidated checklist
  - Partners in Play
  - Question scoring