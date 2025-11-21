<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--compress : Compress the backup file}';
    protected $description = 'Create a database backup';

    public function handle(): int
    {
        $this->info('Starting database backup...');

        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if ($config['driver'] !== 'mysql') {
            $this->error('Backup command currently only supports MySQL/MariaDB');
            return Command::FAILURE;
        }

        try {
            // Generate backup filename
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "backup_{$timestamp}.sql";
            $backupPath = storage_path("app/backups/{$filename}");

            // Ensure backup directory exists
            $backupDir = dirname($backupPath);
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Build mysqldump command
            $command = sprintf(
                'mysqldump --host=%s --port=%s --user=%s --password=%s %s > %s',
                escapeshellarg($config['host']),
                escapeshellarg($config['port']),
                escapeshellarg($config['username']),
                escapeshellarg($config['password']),
                escapeshellarg($config['database']),
                escapeshellarg($backupPath)
            );

            // Execute backup
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                $this->error('Backup failed. Please check database credentials and mysqldump availability.');
                return Command::FAILURE;
            }

            // Check if backup file was created and has content
            if (!file_exists($backupPath) || filesize($backupPath) === 0) {
                $this->error('Backup file was not created or is empty.');
                return Command::FAILURE;
            }

            $fileSize = filesize($backupPath);
            $this->info("Backup created successfully: {$filename} ({$this->formatBytes($fileSize)})");

            // Compress if requested
            if ($this->option('compress')) {
                $compressedPath = $backupPath . '.gz';
                $gz = gzopen($compressedPath, 'w9');
                if ($gz) {
                    gzwrite($gz, file_get_contents($backupPath));
                    gzclose($gz);
                    unlink($backupPath); // Remove uncompressed file
                    $compressedSize = filesize($compressedPath);
                    $this->info("Backup compressed: {$filename}.gz ({$this->formatBytes($compressedSize)})");
                } else {
                    $this->warn('Failed to compress backup, keeping uncompressed version.');
                }
            }

            // Cleanup old backups (keep last 30 days)
            $this->cleanupOldBackups($backupDir);

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Backup failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    protected function cleanupOldBackups(string $backupDir): void
    {
        $files = glob($backupDir . '/backup_*.sql*');
        $cutoffDate = Carbon::now()->subDays(30);

        $deleted = 0;
        foreach ($files as $file) {
            $fileDate = Carbon::createFromTimestamp(filemtime($file));
            if ($fileDate->lt($cutoffDate)) {
                unlink($file);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            $this->info("Cleaned up {$deleted} old backup(s) (older than 30 days)");
        }
    }

    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

