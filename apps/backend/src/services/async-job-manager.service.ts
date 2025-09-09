import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export enum JobStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface Job {
  id: string;
  taskId: string;
  status: JobStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  abortController: AbortController;
  promise: Promise<void>;
}

@Injectable()
export class AsyncJobManagerService {
  private readonly logger = new Logger(AsyncJobManagerService.name);
  private jobs = new Map<string, Job>();
  private eventEmitter = new EventEmitter();

  /**
   * Start a new async job for a taskId
   * If a job is already running for this taskId, it will be cancelled first
   */
  async startJob(
    taskId: string,
    syncFunction: (abortSignal: AbortSignal) => Promise<void>,
  ): Promise<string> {
    // Cancel existing job if running
    await this.cancelJob(taskId);

    const jobId = `sync-${taskId}-${Date.now()}`;
    const abortController = new AbortController();

    const job: Job = {
      id: jobId,
      taskId,
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      abortController,
      promise: this.executeJob(syncFunction, abortController.signal),
    };

    this.jobs.set(taskId, job);
    this.logger.log(`Started async job ${jobId} for ${taskId}`);

    // Don't await here - let it run in background
    job.promise
      .then(() => {
        job.status = JobStatus.COMPLETED;
        job.completedAt = new Date();
        this.logger.log(`Sync job ${jobId} completed successfully`);
        this.eventEmitter.emit(`job-completed-${taskId}`, job);
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') {
          job.status = JobStatus.CANCELLED;
          this.logger.log(`Sync job ${jobId} was cancelled`);
        } else {
          job.status = JobStatus.FAILED;
          job.error = error.message;
          this.logger.error(
            `Sync job ${jobId} failed: ${error.message}`,
            error.stack,
          );
        }
        job.completedAt = new Date();
        this.eventEmitter.emit(`job-completed-${taskId}`, job);
      });

    return jobId;
  }

  /**
   * Cancel a running job for a taskId
   */
  async cancelJob(taskId: string): Promise<boolean> {
    const job = this.jobs.get(taskId);

    if (!job || job.status !== JobStatus.RUNNING) {
      return false;
    }

    this.logger.log(`Cancelling async job ${job.id} for ${taskId}`);
    job.abortController.abort();

    try {
      await job.promise;
    } catch {
      // Expected when job is cancelled
    }

    return true;
  }

  /**
   * Wait for a job to complete (or return immediately if not running)
   */
  async waitForJobCompletion(
    taskId: string,
    timeoutMs = 300000,
  ): Promise<Job | null> {
    const job = this.jobs.get(taskId);

    if (!job) {
      return null;
    }

    if (job.status !== JobStatus.RUNNING) {
      return job;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Sync job timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const onJobCompleted = (completedJob: Job) => {
        clearTimeout(timeout);
        resolve(completedJob);
      };

      this.eventEmitter.once(`job-completed-${taskId}`, onJobCompleted);
    });
  }

  /**
   * Get the current status of a job for taskId
   */
  getJobStatus(taskId: string): Job | null {
    return this.jobs.get(taskId) || null;
  }

  /**
   * Check if a job is currently running for taskId
   */
  isJobRunning(taskId: string): boolean {
    const job = this.jobs.get(taskId);
    return job?.status === JobStatus.RUNNING;
  }

  /**
   * Clean up completed/failed jobs older than specified time
   */
  cleanupOldJobs(olderThanMs = 3600000): void {
    // 1 hour default
    const cutoffTime = Date.now() - olderThanMs;

    for (const [taskId, job] of this.jobs.entries()) {
      if (
        job.status !== JobStatus.RUNNING &&
        job.startedAt.getTime() < cutoffTime
      ) {
        this.jobs.delete(taskId);
        this.logger.log(`Cleaned up old job ${job.id}`);
      }
    }
  }

  private async executeJob(
    syncFunction: (abortSignal: AbortSignal) => Promise<void>,
    abortSignal: AbortSignal,
  ): Promise<void> {
    try {
      await syncFunction(abortSignal);
    } catch (error) {
      if (abortSignal.aborted) {
        throw new Error('Job was cancelled');
      }
      throw error;
    }
  }
}
