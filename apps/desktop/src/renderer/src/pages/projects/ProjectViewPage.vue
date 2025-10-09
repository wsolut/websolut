<template>
  <!-- Loading -->
  <div v-if="projectRequest.status === 'pending'" class="text-gray-400 text-center mt-20">
    <Loader size="xl" />
  </div>

  <!-- Not found -->
  <ProjectNotFound v-else-if="projectRequest.status === 'not_found'" />

  <!-- Project details and pages -->
  <div v-else-if="project" class="p-6">
    <div class="flex justify-between items-start mb-8">
      <div>
        <h1 class="text-white text-xl font-light mb-4">
          {{ project.name }}
        </h1>
        <p
          class="text-gray-300 mt-2 max-w-2xl text-sm break-words whitespace-pre-wrap max-h-60 overflow-y-auto"
        >
          {{ project.description }}
        </p>
      </div>

      <div class="flex items-center space-x-4">
        <Button
          @click="handleProjectPreview"
          variant="primary"
          :disabled="isPagesWithoutPreview"
          class="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon icon="material-symbols:visibility" /><span class="ms-2">Preview</span>
        </Button>

        <Button
          @click="showExportDeployDrawer = true"
          variant="secondary"
          :disabled="isPagesWithoutPreview"
          class="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon icon="material-symbols:arrow-upward" /><span class="ms-2">Export/Deploy</span>
        </Button>

        <ProjectActionsDropdown
          @edit-project="showEditProjectModal = true"
          @delete-project="requestProjectDelete"
        />
      </div>

      <ExportDeployDrawer
        :project="project"
        :is-open="showExportDeployDrawer"
        @close="showExportDeployDrawer = false"
        @project-updated="handleProjectUpdated"
      />
    </div>

    <PageTable
      :pages="pages"
      :loading="pagesRequest.pending"
      @new="handlePageNew"
      @sync="handlePageSync"
      @preview="handlePagePreview"
      @edit="handlePageEdit"
      @delete="requestPageDelete"
    />

    <!-- Modals -->
    <EditProjectModal
      v-if="showEditProjectModal && project"
      :project="project"
      @close="showEditProjectModal = false"
      @updated="handleProjectUpdated"
    />

    <NewPageModal
      v-if="showPageNewModal && project"
      :project="project"
      :num-of-pages="pages.length"
      @close="showPageNewModal = false"
      @created="handlePageCreated"
      class="fixed inset-0 z-50"
    />

    <EditPageModal
      v-if="showEditModal && editingPage !== null"
      :page="editingPage"
      @close="showEditModal = false"
      @updated="handlePageUpdated"
    />

    <DeleteProjectModal
      v-if="showDeleteProjectModal"
      @confirm="handleProjectDelete"
      @cancel="showDeleteProjectModal = false"
    />

    <DeletePageModal
      v-if="showDeletePageModal"
      @confirm="handlePageDelete"
      @cancel="showDeletePageModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { backendClient } from '@/utils';
import Button from '@/components/common/Button.vue';
import ProjectActionsDropdown from '@/components/projects/ProjectActionsDropdown.vue';
import PageTable from '@/components/pages/PageTable.vue';
import NewPageModal from '@/components/pages/NewPageModal.vue';
import EditPageModal from '@/components/pages/EditPageModal.vue';
import EditProjectModal from '@/components/projects/EditProjectModal.vue';
import DeleteProjectModal from '@/components/projects/DeleteProjectModal.vue';
import DeletePageModal from '@/components/pages/DeletePageModal.vue';
import ExportDeployDrawer from '@/components/drawers/ExportDeployDrawer.vue';
import { RequestStatus } from '@/entities';
import { JobStatus, Page, Project } from '@/@types';
import { usePages, useProjects } from '@/composables';
import { Icon } from '@iconify/vue';
import ProjectNotFound from '@/components/projects/ProjectNotFound.vue';
import Loader from '@/components/common/Loader.vue';

const { pageAddJobStatus, pageUpdateJobStatus, pageDeleteJobStatus, pageHasPreview } = usePages();

const { projectAddJobStatus, projectUpdateJobStatus, projectDeleteJobStatus } = useProjects();

const route = useRoute();
const router = useRouter();
const projectId = Number(route.params.projectId);
const isPagesWithoutPreview = computed(() => {
  return !pages.value.some((page) => pageHasPreview(page));
});
const project = ref<Project | undefined>(undefined);
const showExportDeployDrawer = ref<boolean>(false);
const projectRequest = reactive(new RequestStatus());
const pagesRequest = reactive(new RequestStatus());
const pages = ref<Page[]>([]);
const showPageNewModal = ref(false);
const showEditProjectModal = ref(false);
const showEditModal = ref(false);
const showDeleteProjectModal = ref(false);
const showDeletePageModal = ref(false);
const editingPage = ref<Page | null>(null);
const deletingPage = ref<Page | null>(null);
const pagesWsClient = backendClient.pagesWs();
const projectsWsClient = backendClient.projectsWs();
const jobStatusWsClient = backendClient.jobStatusesWs();

onMounted(() => {
  fetchProject();

  fetchPages();

  projectsWsClient.connect();
  projectsWsClient.on(`update`, (data: { project: Project }) => {
    handleProjectUpdated(data.project);
  });

  pagesWsClient.connect();
  pagesWsClient.on(`create`, (data: { page: Page }) => {
    handlePageCreated(data.page);
  });
  pagesWsClient.on(`update`, (data: { page: Page }) => {
    handlePageUpdated(data.page);
  });
  pagesWsClient.on(`delete`, (data: { page: Page }) => {
    handlePageDeleted(data.page);
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
});

function handlePageCreated(createdPage: Page) {
  const existingPage = pages.value.find((p) => p.id === createdPage.id);

  if (existingPage) {
    handlePageUpdated(createdPage);
  } else {
    pages.value.push(createdPage);
  }
}

function handlePageUpdated(updatedPage: Page) {
  pages.value.forEach((existingPage) => {
    if (existingPage.id === updatedPage.id) {
      Object.assign(existingPage, updatedPage);
    }
  });
}

function handlePageDeleted(deletedPage: Page) {
  const index = pages.value.findIndex((p) => p.id === deletedPage.id);

  if (index !== -1) {
    pages.value.splice(index, 1);
  }
}

function handleJobStatusCreated(jobStatus: JobStatus) {
  if (jobStatus.resourceType === 'pages') {
    const pageIndex = pages.value.findIndex((p) => p.id === jobStatus.resourceId);
    if (pageIndex === -1) return;
    const page = pages.value[pageIndex];

    if (page) pageAddJobStatus(page, jobStatus);
  }

  if (jobStatus.resourceType === 'projects') {
    if (project.value) projectAddJobStatus(project.value, jobStatus);
  }
}

function handleJobStatusUpdated(jobStatus: JobStatus) {
  if (jobStatus.resourceType === 'pages') {
    const pageIndex = pages.value.findIndex((p) => p.id === jobStatus.resourceId);
    if (pageIndex === -1) return;
    const page = pages.value[pageIndex];

    if (page) pageUpdateJobStatus(page, jobStatus);
  }

  if (jobStatus.resourceType === 'projects') {
    if (project.value) projectUpdateJobStatus(project.value, jobStatus);
  }
}

function handleJobStatusDeleted(jobStatus: JobStatus) {
  if (jobStatus.resourceType === 'pages') {
    const pageIndex = pages.value.findIndex((p) => p.id === jobStatus.resourceId);
    if (pageIndex === -1) return;
    const page = pages.value[pageIndex];

    if (page) pageDeleteJobStatus(page, jobStatus);
  }

  if (jobStatus.resourceType === 'projects') {
    if (project.value) projectDeleteJobStatus(project.value, jobStatus);
  }
}

function handlePageEdit(page: Page) {
  editingPage.value = page;
  showEditModal.value = true;
}

function fetchProject() {
  projectRequest.status = 'pending';

  backendClient
    .projectsFetchOne(projectId)
    .then((response) => {
      projectRequest.status = 'success';

      if (response.data) {
        project.value = response.data;
      }
    })
    .catch((error) => projectRequest.parseError(error));
}

function fetchPages() {
  pagesRequest.status = 'pending';

  backendClient
    .pagesFetchAll({ projectId })
    .then((response) => {
      pagesRequest.status = 'success';

      if (response.data) {
        pages.value = response.data;
      }
    })
    .catch((error) => pagesRequest.parseError(error));
}

function requestProjectDelete() {
  showDeleteProjectModal.value = true;
}

function requestPageDelete(page: Page) {
  deletingPage.value = page;
  showDeletePageModal.value = true;
}

async function handleProjectDelete() {
  try {
    await backendClient.projectsDestroy(projectId);

    void router.push('/projects');
  } finally {
    showDeleteProjectModal.value = false;
  }
}

async function handlePageDelete() {
  try {
    if (deletingPage.value) {
      await backendClient.pagesDestroy(deletingPage.value.id).then(() => {
        if (deletingPage.value) handlePageDeleted(deletingPage.value);
      });
    }
  } finally {
    showDeletePageModal.value = false;
    deletingPage.value = null;
  }
}

function handleProjectPreview() {
  window.open(backendClient.projectsPreviewUrl(projectId), '_blank');
}

function handlePagePreview(page: Page) {
  window.open(backendClient.projectsPreviewUrl(projectId, page.path), '_blank');
}

function handlePageNew() {
  showPageNewModal.value = true;
}

function handlePageSync(page: Page) {
  void backendClient.pagesSynchronize(page.id);
}

function handleProjectUpdated(updatedProject: Project) {
  if (!project.value) return;
  if (project.value.id !== updatedProject.id) return;

  Object.assign(project.value, updatedProject);
}
</script>
