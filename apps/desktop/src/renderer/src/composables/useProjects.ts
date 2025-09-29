import { JobStatus, Project } from '@/@types';
import { useJobStatuses } from './useJobStatuses';

const { findJobStatus, jobFinished, jobRunning, jobFailed, jobSuccessful } = useJobStatuses();

type JobData = {
  token: string;
  name: string;
  url: string;
  baseUrl: string;
};

export function useProjects() {
  function projectVercelToken(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    if (!jobStatus || !jobFinished(jobStatus)) return '';

    const data = jobStatus.data as JobData;

    return data.token;
  }

  function projectVercelName(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');
    const defaultName = project.name;

    if (!jobStatus || !jobFinished(jobStatus)) return defaultName;

    const data = jobStatus.data as JobData;

    return data.name || defaultName;
  }

  function projectVercelUrl(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    if (!jobStatus || !jobFinished(jobStatus)) return '';

    const data = jobStatus.data as JobData;

    return data.url;
  }

  function projectWordpressBaseUrl(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    if (!jobStatus || !jobFinished(jobStatus)) return '';

    const data = jobStatus.data as JobData;

    return data.baseUrl;
  }

  function projectWordpressToken(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    if (!jobStatus || !jobFinished(jobStatus)) return '';

    const data = jobStatus.data as JobData;

    return data.token;
  }

  function projectWordpressUrl(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    if (!jobStatus || !jobFinished(jobStatus)) return '';

    const data = jobStatus.data as JobData;

    return data.url;
  }

  function projectIsDeployingToVercel(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    return jobRunning(jobStatus);
  }

  function projectFailedDeployToVercel(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    return jobFailed(jobStatus);
  }

  function projectDeployToVercelSuccess(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    return jobSuccessful(jobStatus);
  }

  function projectDeployToVercelFinished(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    return jobFinished(jobStatus);
  }

  function projectDeployToVercelErrorTitle(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    if (!jobFailed(jobStatus)) return '';

    switch (jobStatus?.errorCode) {
      case 422:
        return '';
      case 500:
        return 'Internal Server Error';
      case 503:
        return 'Network Error';
      default:
        return 'Unknown Error';
    }
  }

  function projectDeployToVercelErrorMessage(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-vercel');

    if (!jobFailed(jobStatus)) return '';

    switch (jobStatus?.errorCode) {
      case 422:
        return '';
      case 500:
        return `Something went wrong on our side. Please try again later.`;
      case 503:
        return `Network unavailable. Please check your connection and try again.`;
      default:
        return jobStatus?.errorStackTrace || '';
    }
  }

  function projectAddJobStatus(project: Project, jobStatus: JobStatus) {
    if (jobStatus.resourceType !== 'projects') return;

    const existingJobStatus = project.jobStatuses.find((j) => j.id === jobStatus.id);

    if (existingJobStatus) {
      projectUpdateJobStatus(project, jobStatus);
    } else {
      project.jobStatuses.push(jobStatus);
    }
  }

  function projectUpdateJobStatus(project: Project, jobStatus: JobStatus) {
    project.jobStatuses.forEach((existingJobStatus) => {
      if (existingJobStatus.id === jobStatus.id) {
        Object.assign(existingJobStatus, jobStatus);
      }
    });
  }

  function projectDeleteJobStatus(project: Project, jobStatus: JobStatus) {
    project.jobStatuses = project.jobStatuses.filter((j) => j.id !== jobStatus.id);
  }

  function projectIsDeployingToWordpress(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    return jobRunning(jobStatus);
  }

  function projectDeployToWordpressFinished(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    return jobFinished(jobStatus);
  }

  function projectDeployToWordpressSuccess(project: Project): boolean {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    return jobSuccessful(jobStatus);
  }

  function projectDeployToWordpressErrorTitle(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    if (!jobFailed(jobStatus)) return '';

    switch (jobStatus?.errorCode) {
      case 422:
        return '';
      case 500:
        return 'Internal Server Error';
      case 503:
        return 'Network Error';
      default:
        return 'Unknown Error';
    }
  }

  function projectDeployToWordpressErrorMessage(project: Project): string {
    const jobStatus = findJobStatus(project.jobStatuses, 'deploy-to-wordpress');

    if (!jobFailed(jobStatus)) return '';

    switch (jobStatus?.errorCode) {
      case 422:
        return '';
      case 500:
        return `Something went wrong on our side. Please try again later.`;
      case 503:
        return `Network unavailable. Please check your connection and try again.`;
      default:
        return jobStatus?.errorStackTrace || '';
    }
  }

  return {
    projectAddJobStatus,
    projectDeleteJobStatus,
    projectDeployToVercelFinished,
    projectDeployToVercelErrorMessage,
    projectDeployToVercelErrorTitle,
    projectDeployToVercelSuccess,
    projectDeployToWordpressFinished,
    projectFailedDeployToVercel,
    projectIsDeployingToVercel,
    projectIsDeployingToWordpress,
    projectUpdateJobStatus,
    projectDeployToWordpressSuccess,
    projectVercelName,
    projectVercelToken,
    projectVercelUrl,
    projectWordpressBaseUrl,
    projectWordpressToken,
    projectDeployToWordpressErrorTitle,
    projectDeployToWordpressErrorMessage,
    projectWordpressUrl,
  };
}
