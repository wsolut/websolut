<template>
  <!-- Loading -->
  <div v-if="projectRequest.status === 'pending'" class="text-gray-400 text-center mt-20">
    <Loader size="xl" />
  </div>

  <!-- Not found -->
  <ProjectNotFound v-else-if="projectRequest.status === 'not_found'" />

  <!-- Page Preview and floating Buttons -->
  <div v-else-if="project">
    <section v-if="!page" class="text-[#E5E9ED] px-8 py-12 bg-[#0A0D10] min-h-[calc(100vh-64px)]">
      <div v-if="pageRequest.pending" class="flex justify-center mt-32">
        <Loader size="xl" />
      </div>

      <div v-else>
        <p class="text-center">{{ previewNotFoundReason }}</p>
      </div>
    </section>

    <div v-if="page">
      <PreviewFloatingButtons
        :is-drawer-open="isDrawerOpen"
        :synchronizing="pageIsSynchronizing(page)"
        :sync-complete="pageSyncComplete(page)"
        @toggle-drawer="handleToggleDrawer"
        @sync="handleSync"
      />

      <PreviewDrawer
        :page="page"
        :is-open="isDrawerOpen"
        :project="project"
        :edit-mode="editMode"
        :has-uncommitted-changes="hasUncommittedChanges"
        @update-content="handleUpdateContent"
        @revert-content="handleRevertContent"
        @toggle-edit-mode="handleToggleEditMode"
        @sync="handleSync"
        @close="handleDrawerClose"
        @project-updated="handleProjectUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { backendClient } from '@/utils';
import Loader from '@/components/common/Loader.vue';
import PreviewDrawer from '@/components/pages/PreviewDrawer.vue';
import PreviewFloatingButtons from '@/components/pages/PreviewFloatingButtons.vue';
import { JobStatus, Page, PageContent, Project } from '@/@types';
import morphdom from 'morphdom';
import { usePages, useProjects } from '@/composables';
import { RequestStatus } from '@/entities';
import ProjectNotFound from '@/components/projects/ProjectNotFound.vue';

const {
  pageIsSynchronizing,
  pageSyncComplete,
  pageAddJobStatus,
  pageUpdateJobStatus,
  pageDeleteJobStatus,
} = usePages();

const { projectAddJobStatus, projectUpdateJobStatus, projectDeleteJobStatus } = useProjects();

const route = useRoute();
const pagePath = ref<string>(route.params.pagePath ? String(route.params.pagePath) : '');
const page = ref<Page | undefined>(undefined);
const pageContent = ref<PageContent>({});
const project = ref<Project | undefined>(undefined);
const isDrawerOpen = ref<boolean>(false);
const editMode = ref<boolean>(false);
const previewNotFoundReason = ref<string>('Preview not found');
const pageRequest = reactive(new RequestStatus());
const projectRequest = reactive(new RequestStatus());
const pagesWsClient = backendClient.pagesWs();
const projectsWsClient = backendClient.projectsWs();
const jobStatusWsClient = backendClient.jobStatusesWs();
const previewFrameEl = document.getElementById('preview-frame') as HTMLIFrameElement;
const uncommittedContent = ref<Record<string, { text: string }>>({});

const projectId = computed(() => Number(route.params.projectId));
const hasUncommittedChanges = computed(() => Object.keys(uncommittedContent.value).length > 0);

onMounted(() => {
  previewFrameEl.addEventListener('load', addPreviewFrameEventListeners);

  projectsWsClient.connect();
  projectsWsClient.on(`update`, (data: { project: Project }) => {
    handleProjectUpdated(data.project);
  });

  pagesWsClient.connect();
  pagesWsClient.on(`preview-update`, (data: { page: Page; content: string }) => {
    if (data.page.id !== page.value?.id) return;

    updateIframe(data.content);
  });
  pagesWsClient.on(`update`, (data: { page: Page }) => {
    if (data.page.id !== page.value?.id) return;

    updatePage(data.page);
  });
  pagesWsClient.on(`delete`, (data: { page: Page }) => {
    if (data.page.id !== page.value?.id) return;

    updatePage(undefined);

    previewNotFoundReason.value = 'This Page was deleted!';
  });

  jobStatusWsClient.connect();
  jobStatusWsClient.on(`create`, (data: { jobStatus: JobStatus }) => {
    handleJobStatusCreated(data.jobStatus);
  });
  jobStatusWsClient.on(`update`, (data: { jobStatus: JobStatus }) => {
    handleJobStatusUpdated(data.jobStatus);
  });
  jobStatusWsClient.on(`delete`, (data: { jobStatus: JobStatus }) => {
    handleJobStatusDeleted(data.jobStatus);
  });

  fetchPage();
  fetchProject();
});

onUnmounted(() => {
  pagesWsClient.disconnect();

  removePreviewFrameEventListeners();

  previewFrameEl.removeEventListener('load', addPreviewFrameEventListeners);
});

function updatePage(updatedPage: Page | undefined) {
  page.value = updatedPage;

  if (!page.value) {
    previewFrameEl.removeAttribute('src');

    return;
  }

  previewFrameEl.setAttribute(
    'src',
    backendClient.rawProjectsPreviewUrl(projectId.value, page.value.id),
  );

  void backendClient.pagesFetchContent(page.value.id).then((response) => {
    if (response.data) {
      pageContent.value = response.data;

      addContentEditableAttributeToTextElements();
    }
  });
}

function addContentEditableAttributeToTextElements() {
  const previewFrameDoc = getPreviewFrameDoc();

  if (!previewFrameDoc) return;

  Object.keys(pageContent.value).forEach((id) => {
    const content = pageContent.value[id];

    if (content.text) {
      const el = previewFrameDoc.getElementById(id);

      if (el) {
        el.setAttribute('contenteditable', editMode.value ? 'true' : 'false');
      }
    }
  });
}

function addPreviewFrameEventListeners() {
  const previewFrameDoc = getPreviewFrameDoc();

  if (previewFrameDoc) {
    addContentEditableAttributeToTextElements();

    previewFrameDoc.body.addEventListener('click', handleIframeClicks);
    previewFrameDoc.body.addEventListener('input', handleIframeInputs);

    togglePreviewFrameContenteditables();
  }
}

function removePreviewFrameEventListeners() {
  const previewFrameDoc = getPreviewFrameDoc();

  if (previewFrameDoc && previewFrameDoc.body) {
    previewFrameDoc.body.removeEventListener('click', handleIframeClicks);
    previewFrameDoc.body.removeEventListener('input', handleIframeInputs);
  }
}

function getPreviewFrameDoc() {
  return previewFrameEl.contentDocument || previewFrameEl.contentWindow?.document;
}

function updateIframe(content: string) {
  const previewFrameDoc = getPreviewFrameDoc();

  if (!previewFrameDoc) return;

  removePreviewFrameEventListeners();

  // Parse the full HTML document
  const parser = new DOMParser();
  const newDoc = parser.parseFromString(content, 'text/html');

  // Check if head content has changed before updating
  const currentHeadHtml = previewFrameDoc.head?.innerHTML || '';
  const newHeadHtml = newDoc.head?.innerHTML || '';
  const headChanged = currentHeadHtml !== newHeadHtml;

  // Update the body section
  if (newDoc.body) {
    morphdom(previewFrameDoc.body, newDoc.body, {
      childrenOnly: true,
    });

    addPreviewFrameEventListeners();
  }

  // Update the head section only if it changed
  if (newDoc.head && previewFrameDoc.head && headChanged) {
    morphdom(previewFrameDoc.head, newDoc.head, {
      childrenOnly: true,
    });
  }
}

function handleIframeInputs(e: Event) {
  const target = e.target as HTMLElement;

  // Handle input events within the iframe
  if (target.getAttribute('contenteditable') === 'true') {
    handleTextUpdate(target);
  }
}

// Intercept anchor clicks so links navigate within the preview base
function handleIframeClicks(e: MouseEvent) {
  // Respect modifier keys and non-left clicks
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return;
  }

  const targetEl = e.target as HTMLElement | null;
  if (!targetEl) return;

  const anchor = targetEl.closest('a');
  if (!anchor) return;

  const a = anchor;
  // Prevent default early to avoid the browser performing a full navigation
  // if we later determine this is an in-app link we want to handle.
  // We'll bail out and let it proceed for excluded cases below.
  let rawHref = a.getAttribute('href') || '';

  // Ignore: external, hash, mailto/tel, downloads, explicit targets
  if (
    !rawHref ||
    rawHref.startsWith('#') ||
    /^(?:[a-z]+:)?\/\//i.test(rawHref) || // absolute with scheme or protocol-relative
    rawHref.startsWith('mailto:') ||
    rawHref.startsWith('tel:') ||
    a.hasAttribute('download') ||
    a.target === '_blank'
  ) {
    return;
  }

  // Normalize root-relative
  if (rawHref.startsWith('/')) rawHref = rawHref.slice(1);

  // // Build path under preview base
  let basePath = window.location.pathname;
  if (!basePath.endsWith('/')) basePath += '/';

  // Resolve relative paths using URL constructor
  const resolvedUrl = new URL(rawHref, window.location.origin + basePath);
  const newPath = resolvedUrl.pathname;
  const spaPath = backendClient.projectsPreviewPath(projectId.value, '');

  let newPagePath = newPath.replace(spaPath, '').replace(/^\//, '').replace(/\/$/, '');

  // No need to update the URL if the path has not changed
  if (pagePath.value === newPagePath) {
    return;
  }

  // Let the parent know that it needs to fetch the new page's details
  handlePageChange(newPagePath);
}

function handleToggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value;
}

function handleSync() {
  if (!page.value) return;

  void backendClient.pagesSynchronize(page.value.id);
}

function handleTextUpdate(element: HTMLElement) {
  if (!page.value) return;

  uncommittedContent.value[element.id] = {
    text: element.innerText,
  };
}

function togglePreviewFrameContenteditables() {
  const previewFrameDoc = getPreviewFrameDoc();

  if (!previewFrameDoc) return;

  previewFrameDoc.body.querySelectorAll('[contenteditable]').forEach((el) => {
    const elContentEditable = el.getAttribute('contenteditable');

    if (editMode.value === false && elContentEditable === 'true') {
      el.setAttribute('contenteditable', 'false');
    } else if (editMode.value === true && elContentEditable === 'false') {
      el.setAttribute('contenteditable', 'true');
    }
  });
}

function handleDrawerClose() {
  isDrawerOpen.value = false;
}

function handleToggleEditMode() {
  editMode.value = !editMode.value;

  togglePreviewFrameContenteditables();
}

function fetchPage() {
  pageRequest.status = 'pending';

  void backendClient
    .pagesFetchAll({ projectId: projectId.value, path: pagePath.value })
    .then((response) => {
      pageRequest.status = 'success';

      if (response.data) {
        updatePage(response.data[0]);
      }
    })
    .catch((error) => pageRequest.parseError(error));
}

function fetchProject() {
  projectRequest.status = 'pending';

  void backendClient
    .projectsFetchOne(projectId.value)
    .then((response) => {
      projectRequest.status = 'success';

      if (response.data) {
        project.value = response.data;
      }
    })
    .catch((error) => projectRequest.parseError(error));
}

function handlePageChange(newPagePath: string) {
  pagePath.value = newPagePath;

  fetchPage();

  globalThis.history.pushState(
    {},
    '',
    backendClient.projectsPreviewPath(projectId.value, pagePath.value),
  );
}

function handleProjectUpdated(updatedProject: Project) {
  if (!project.value) return;
  if (project.value.id !== updatedProject.id) return;

  Object.assign(project.value, updatedProject);
}

function handleJobStatusCreated(jobStatus: JobStatus) {
  if (jobStatus.resourceType === 'pages') {
    if (page.value) pageAddJobStatus(page.value, jobStatus);
  }

  if (jobStatus.resourceType === 'projects') {
    if (project.value) projectAddJobStatus(project.value, jobStatus);
  }
}

function handleJobStatusUpdated(jobStatus: JobStatus) {
  if (jobStatus.resourceType === 'pages') {
    if (page.value) pageUpdateJobStatus(page.value, jobStatus);
  }

  if (jobStatus.resourceType === 'projects') {
    if (project.value) projectUpdateJobStatus(project.value, jobStatus);
  }
}

function handleJobStatusDeleted(jobStatus: JobStatus) {
  if (jobStatus.resourceType === 'pages') {
    if (page.value) pageDeleteJobStatus(page.value, jobStatus);
  }

  if (jobStatus.resourceType === 'projects') {
    if (project.value) projectDeleteJobStatus(project.value, jobStatus);
  }
}

function handleUpdateContent() {
  if (!page.value) return;

  void backendClient
    .pagesUpdateContent(page.value.id, uncommittedContent.value)
    .then((response) => {
      Object.assign(page, response.data);

      uncommittedContent.value = {};
    });
}

function handleRevertContent() {
  if (!page.value) return;

  if (!confirm('Are you sure you want to reset the content? This action cannot be undone.')) {
    return;
  }

  void backendClient.pagesRevertContent(page.value.id).then((response) => {
    Object.assign(page, response.data);
  });
}
</script>
