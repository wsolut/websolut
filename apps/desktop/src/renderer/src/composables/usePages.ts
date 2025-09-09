import { JobStatus, Page } from '@/@types';
import { useJobStatuses } from './useJobStatuses';

const SYNC_COMPLETE_THRESHOLD = 2000;

const { findJobStatus, jobRunning, jobFinished, jobFailed, jobComplete } = useJobStatuses();

export function usePages() {
  function pageHasPreview(page: Page): boolean {
    const jobStatus = findJobStatus(page.jobStatuses, 'preview');

    return jobFinished(jobStatus);
  }

  function pageIsSynchronizing(page: Page): boolean {
    const jobStatus = findJobStatus(page.jobStatuses, 'synchronize');

    return jobRunning(jobStatus);
  }

  function pageSyncComplete(page: Page): boolean {
    const jobStatus = findJobStatus(page.jobStatuses, 'synchronize');

    return jobComplete(jobStatus, SYNC_COMPLETE_THRESHOLD);
  }

  function pageFailedSynchronization(page: Page) {
    const jobStatus = findJobStatus(page.jobStatuses, 'synchronize');

    return jobFailed(jobStatus);
  }

  function pageSynchronizeErrorTitle(page: Page) {
    const jobStatus = findJobStatus(page.jobStatuses, 'synchronize');

    if (!jobFailed(jobStatus)) return '';

    switch (jobStatus?.errorCode) {
      case 403:
        return 'Invalid Figma Token';
      case 404:
        return 'File Not Found';
      case 500:
        return 'Internal Server Error';
      default:
        return 'Unknown Error';
    }
  }

  function pageSynchronizeErrorMessage(page: Page) {
    const jobStatus = findJobStatus(page.jobStatuses, 'synchronize');

    if (!jobFailed(jobStatus)) return '';

    switch (jobStatus?.errorCode) {
      case 403:
        return `Figma Token doesn't seem to allow access to Figma File submitted in the Figma URL.`;
      case 404:
        return `Resource not found, the page could have been deleted or access is restricted.`;
      case 500:
        return `The synchronization failed. Please try again shortly. `;
      default:
        return jobStatus?.errorStackTrace;
    }
  }

  function pageLastSyncedAt(page: Page): string {
    const jobStatus = findJobStatus(page.jobStatuses, 'synchronize');

    if (!jobStatus) return '-';

    if (!jobStatus.finishedAt) return '-';

    const finishedAt = new Date(jobStatus.finishedAt);

    return finishedAt.toLocaleString();
  }

  function pageAddJobStatus(page: Page, jobStatus: JobStatus) {
    if (jobStatus.resourceType !== 'pages') return;

    const existingJobStatus = page.jobStatuses.find((j) => j.id === jobStatus.id);

    if (existingJobStatus) {
      pageUpdateJobStatus(page, jobStatus);
    } else {
      page.jobStatuses.push(jobStatus);
    }
  }

  function pageUpdateJobStatus(page: Page, jobStatus: JobStatus) {
    page.jobStatuses.forEach((existingJobStatus) => {
      if (existingJobStatus.id === jobStatus.id) {
        Object.assign(existingJobStatus, jobStatus);
      }
    });
  }

  function pageDeleteJobStatus(page: Page, jobStatus: JobStatus) {
    page.jobStatuses = page.jobStatuses.filter((j) => j.id !== jobStatus.id);
  }

  return {
    pageAddJobStatus,
    pageUpdateJobStatus,
    pageDeleteJobStatus,
    pageIsSynchronizing,
    pageHasPreview,
    pageLastSyncedAt,
    pageSyncComplete,
    pageFailedSynchronization,
    pageSynchronizeErrorTitle,
    pageSynchronizeErrorMessage,
  };
}
