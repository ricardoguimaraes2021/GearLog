# Database Setup and Security Guide

## Database User Permissions

For security best practices, create dedicated database users with minimal required permissions instead of using the root user.

### Recommended Database Users

#### 1. Application User (Read/Write)
This user should have permissions to:
- SELECT, INSERT, UPDATE, DELETE on all application tables
- CREATE, ALTER, DROP on migrations (only during deployment)
- LOCK TABLES (for migrations)

**MySQL/MariaDB Setup:**
```sql
-- Create application user
CREATE USER 'gearlog_app'@'localhost' IDENTIFIED BY 'strong_password_here';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON gearlog.* TO 'gearlog_app'@'localhost';
GRANT CREATE, ALTER, DROP, LOCK TABLES ON gearlog.* TO 'gearlog_app'@'localhost';

-- For production, restrict to specific host
CREATE USER 'gearlog_app'@'your_app_server_ip' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON gearlog.* TO 'gearlog_app'@'your_app_server_ip';
GRANT CREATE, ALTER, DROP, LOCK TABLES ON gearlog.* TO 'gearlog_app'@'your_app_server_ip';

FLUSH PRIVILEGES;
```

#### 2. Read-Only User (Optional - for reporting/backups)
This user should have permissions to:
- SELECT on all application tables

**MySQL/MariaDB Setup:**
```sql
CREATE USER 'gearlog_readonly'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT SELECT ON gearlog.* TO 'gearlog_readonly'@'localhost';
FLUSH PRIVILEGES;
```

### Environment Configuration

Update your `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gearlog
DB_USERNAME=gearlog_app
DB_PASSWORD=strong_password_here
```

### SSL/TLS Configuration

For production, enable SSL/TLS connections:

1. Generate SSL certificates or obtain from your database provider
2. Update `.env`:
```env
DB_SSL_CA=/path/to/ca-cert.pem
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem
DB_SSL_VERIFY_SERVER_CERT=true
DB_SSL_MODE=require
```

### Connection Security Settings

The following environment variables are available for additional security:

```env
# Connection timeout (seconds)
DB_TIMEOUT=10

# Connection pool settings
DB_POOL_MIN=1
DB_POOL_MAX=10
```

## Backup Configuration

### Automated Backups

Backups are scheduled to run daily at 2 AM via Laravel scheduler.

**Manual Backup:**
```bash
php artisan db:backup
php artisan db:backup --compress  # Compressed backup
```

**Backup Location:**
- Uncompressed: `storage/app/backups/backup_YYYY-MM-DD_HH-MM-SS.sql`
- Compressed: `storage/app/backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz`

**Backup Retention:**
- Automatically keeps last 30 days
- Older backups are automatically deleted

**Restore Backup:**
```bash
# Uncompressed
mysql -u gearlog_app -p gearlog < storage/app/backups/backup_YYYY-MM-DD_HH-MM-SS.sql

# Compressed
gunzip < storage/app/backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz | mysql -u gearlog_app -p gearlog
```

## Security Checklist

- [ ] Create dedicated database user (not root)
- [ ] Grant minimal required permissions
- [ ] Enable SSL/TLS in production
- [ ] Configure connection timeout
- [ ] Set up automated backups
- [ ] Test backup restore procedure
- [ ] Restrict database access by IP (if possible)
- [ ] Use strong database passwords
- [ ] Regularly rotate database passwords
- [ ] Monitor database access logs

## Performance Optimization

### Indexes

The following indexes are automatically created for performance:
- Foreign key indexes
- Frequently queried columns (status, company_id, etc.)
- Composite indexes for common query patterns

### Query Optimization

- Use Eloquent ORM (prevents SQL injection)
- Avoid N+1 queries (use eager loading)
- Use database transactions for complex operations
- Monitor slow queries in production

## Troubleshooting

### Connection Issues

If you encounter connection issues:
1. Verify database credentials in `.env`
2. Check database server is running
3. Verify network connectivity
4. Check firewall rules
5. Verify SSL certificates (if using SSL)

### Backup Issues

If backups fail:
1. Verify `mysqldump` is installed and in PATH
2. Check database user has necessary permissions
3. Verify disk space is available
4. Check backup directory permissions

