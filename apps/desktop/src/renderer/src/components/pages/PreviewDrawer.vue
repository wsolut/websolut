<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { backendClient } from '@/utils';
import Drawer from '@/components/common/Drawer.vue';
import PreviewDrawerEditorTab from '@/components/pages/PreviewDrawerEditorTab.vue';
import PreviewDrawerExportDeployTab from '@/components/pages/PreviewDrawerExportDeployTab.vue';
import DeployToVercel from '@/components/drawers/DeployToVercel.vue';
import DeployToWordpress from '@/components/drawers/DeployToWordpress.vue';
import { TabsList, TabsRoot, TabsTrigger } from 'radix-vue';
import { Page, Project } from '@/@types';
import { RequestStatus } from '@/entities';
import { useProjects } from '@/composables';

const { projectVercelToken, projectVercelName, projectWordpressToken, projectWordpressBaseUrl } =
  useProjects();

const emit = defineEmits([
  'toggle-edit-mode',
  'update-content',
  'revert-content',
  'sync',
  'close',
  'project-updated',
]);

const props = defineProps<{
  project: Project;
  page: Page;
  editMode: boolean;
  isOpen: boolean;
  hasUncommittedChanges: boolean;
}>();

const page = computed(() => props.page);
const selectedTab = ref('content');
const showVercelDeployView = ref(false);
const showVercelDeploymentStatus = ref(false);
const showWordpressDeployView = ref(false);
const showWordpressDeploymentStatus = ref(false);
const vercelDeploymentRequest = reactive(new RequestStatus());
const wordpressDeploymentRequest = reactive(new RequestStatus());

function handleDrawerClose() {
  emit('close');

  showVercelDeployView.value = false;
  showWordpressDeployView.value = false;

  vercelDeploymentRequest.status = 'idle';
  wordpressDeploymentRequest.status = 'idle';
}

async function handleExportToHtml() {
  await backendClient.downloadProjectsExport(props.project.id, 'static-html');
}

async function handleExportToWordpress() {
  await backendClient.downloadProjectsExport(props.project.id, 'wordpress');
}

function handleDeployToVercel(token: string, projectName: string) {
  vercelDeploymentRequest.status = 'pending';

  backendClient
    .projectsDeploy(props.project.id, 'vercel', { token, projectName })
    .then((response) => {
      vercelDeploymentRequest.status = 'success';
      if (response.data) {
        emit('project-updated', response.data || {});
      }
    })
    .catch((error) => vercelDeploymentRequest.parseError(error));
}

function handleDeployToWordpress(token: string, baseUrl: string) {
  wordpressDeploymentRequest.status = 'pending';

  backendClient
    .projectsDeploy(props.project.id, 'wordpress', { token, baseUrl })
    .then((response) => {
      wordpressDeploymentRequest.status = 'success';
      if (response.data) {
        emit('project-updated', response.data || {});
      }
    })
    .catch((error) => wordpressDeploymentRequest.parseError(error));
}

function handleVercelDeployGoBack() {
  showVercelDeployView.value = false;
  vercelDeploymentRequest.status = 'idle';
}

function handleWordpressDeployGoBack() {
  showWordpressDeployView.value = false;
  wordpressDeploymentRequest.status = 'idle';
}
function handleResetVercelRequest() {
  vercelDeploymentRequest.status = 'idle';
}

function handleResetWordpressRequest() {
  wordpressDeploymentRequest.status = 'idle';
}
</script>

<template>
  <Drawer v-if="page.id" :is-open="isOpen" @close="handleDrawerClose">
    <template #header>
      <TabsRoot
        v-model="selectedTab"
        v-if="!showVercelDeployView && !showWordpressDeployView"
        class="w-full"
      >
        <TabsList
          class="relative flex border-b border-gray-700 gap-6 justify-center"
          aria-label="Preview settings tabs"
        >
          <TabsTrigger
            class="px-8 py-2 text-sm font-medium text-gray-300 hover:text-white data-[state=active]:text-green-500 outline-none transition-colors relative"
            value="content"
          >
            Editor
            <div
              v-if="selectedTab === 'content'"
              class="absolute left-0 right-0 h-[2px] bottom-0 bg-green-500"
            />
          </TabsTrigger>
          <TabsTrigger
            class="px-8 py-2 text-sm font-medium text-gray-300 hover:text-white data-[state=active]:text-green-500 outline-none transition-colors relative"
            value="export-deploy"
          >
            Deploy/Export
            <div
              v-if="selectedTab === 'export-deploy'"
              class="absolute left-0 right-0 h-[2px] bottom-0 bg-green-500"
            />
          </TabsTrigger>
        </TabsList>
      </TabsRoot>
    </template>

    <div v-if="selectedTab === 'content'">
      <PreviewDrawerEditorTab
        :page="page"
        :has-uncommitted-changes="hasUncommittedChanges"
        :edit-mode="editMode"
        @toggle-edit-mode="emit('toggle-edit-mode')"
        @update-content="emit('update-content')"
        @revert-content="emit('revert-content')"
        @sync="emit('sync')"
      />
    </div>

    <div v-if="selectedTab === 'export-deploy'">
      <DeployToVercel
        v-if="showVercelDeployView"
        @go-back="handleVercelDeployGoBack"
        @deploy-start="handleDeployToVercel"
        @dismiss-deployment-status="showVercelDeploymentStatus = false"
        @reset-deployment-request="handleResetVercelRequest"
        :project="project"
        :deployment-request="vercelDeploymentRequest"
        :show-deployment-status="showVercelDeploymentStatus"
      />

      <DeployToWordpress
        v-if="showWordpressDeployView"
        @go-back="handleWordpressDeployGoBack"
        @deploy-start="handleDeployToWordpress"
        @dismiss-deployment-status="showWordpressDeploymentStatus = false"
        @reset-deployment-request="handleResetWordpressRequest"
        :project="project"
        :deployment-request="wordpressDeploymentRequest"
        :show-deployment-status="showWordpressDeploymentStatus"
      />

      <div v-if="!showVercelDeployView && !showWordpressDeployView">
        <PreviewDrawerExportDeployTab
          :deploying-to-vercel="vercelDeploymentRequest.pending"
          :vercel-token="projectVercelToken(project)"
          :deploying-to-wordpress="wordpressDeploymentRequest.pending"
          :wordpress-token="projectWordpressToken(project)"
          :wordpress-base-url="projectWordpressBaseUrl(project)"
          :project-name="projectVercelName(project)"
          @export-to-html="handleExportToHtml"
          @export-to-wordpress="handleExportToWordpress"
          @show-vercel-deploy="showVercelDeployView = true"
          @show-wordpress-deploy="showWordpressDeployView = true"
        />
      </div>
    </div>
  </Drawer>
</template>

<style scoped></style>
