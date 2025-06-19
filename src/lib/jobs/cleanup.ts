// /src/lib/jobs/cleanup.ts
import { dbRepository } from '../db/repository';
import { timeoutRecoveryService } from './timeoutRecovery';

class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Starting cleanup service...');

    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch(error => {
        console.error('Cleanup error:', error);
      });
    }, 60 * 60 * 1000); // 1 hour

    // Run initial cleanup
    this.runCleanup().catch(error => {
      console.error('Initial cleanup error:', error);
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('Cleanup service stopped');
  }

  private async runCleanup(): Promise<void> {
    try {
      // Clean up expired stories
      const deletedCount = await dbRepository.cleanupExpiredStories();
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired stories`);
      }

      // Additional cleanup tasks can be added here:
      // - Remove old generation jobs
      // - Clean up orphaned pages
      // - Archive completed stories older than X days

    } catch (error) {
      console.error('Cleanup task failed:', error);
    }
  }

  async forceCleanup(): Promise<number> {
    return await this.runCleanup().then(() => dbRepository.cleanupExpiredStories());
  }
}

export const cleanupService = new CleanupService();

// Start services when the module loads (for serverless environments)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // In production, start the services
  timeoutRecoveryService.start().catch(console.error);
  cleanupService.start();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await timeoutRecoveryService.stop();
    cleanupService.stop();
  });
}