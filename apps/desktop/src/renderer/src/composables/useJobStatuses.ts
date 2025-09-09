import { JobStatus } from '@/@types';

export function useJobStatuses() {
  function findJobStatus(jobStatuses: JobStatus[], name): JobStatus | undefined {
    const jobStatus = jobStatuses.find((j) => j.name === name);

    return jobStatus;
  }

  function jobRunning(jobStatus: JobStatus | undefined): boolean {
    return !!(jobStatus && jobStatus.startedAt && !jobStatus.finishedAt);
  }

  function jobFinished(jobStatus: JobStatus | undefined): boolean {
    return !!(jobStatus && jobStatus.startedAt && jobStatus.finishedAt);
  }

  function jobFailed(jobStatus: JobStatus | undefined): boolean {
    return !!(jobStatus && jobStatus.errorCode > 0);
  }

  function jobSuccessful(jobStatus: JobStatus | undefined): boolean {
    if (!jobFinished(jobStatus)) return false;

    return !jobFailed(jobStatus);
  }

  function jobComplete(jobStatus: JobStatus | undefined, threshold: number): boolean {
    if (!jobFinished(jobStatus)) return false;

    if (!jobStatus) return false; // To please TS
    if (!jobStatus.finishedAt) return false; // To please TS

    const currentTime = Date.now();
    const finishedTime = new Date(jobStatus.finishedAt).getTime();

    return finishedTime > currentTime - threshold;
  }

  return {
    jobSuccessful,
    jobComplete,
    findJobStatus,
    jobRunning,
    jobFinished,
    jobFailed,
  };
}
