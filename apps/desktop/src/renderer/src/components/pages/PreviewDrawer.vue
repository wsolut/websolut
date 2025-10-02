<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { backendClient } from '@/utils';
import Drawer from '@/components/common/Drawer.vue';
import PreviewDrawerEditorTab from '@/components/pages/PreviewDrawerEditorTab.vue';
import PreviewDrawerExportDeployTab from '@/components/pages/PreviewDrawerExportDeployTab.vue';
import DeployToVercel from '@/components/drawers/DeployToVercel.vue';
import DeployToWordpress from '@/components/drawers/DeployToWordpress.vue';
import DrawerConfirmationModal from '../modals/DrawerConfirmationModal.vue';
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

const vercelDeploymentRequest = reactive(new RequestStatus());
const wordpressDeploymentRequest = reactive(new RequestStatus());
const showUnsavedChangesModal = ref(false);
const hasVercelUnsavedChanges = ref(false);
const hasWordpressUnsavedChanges = ref(false);
const pendingAction = ref<(() => void) | null>(null);

const initialVercelToken = ref('');
const initialVercelProjectName = ref('');
const initialWordpressToken = ref('');
const initialWordpressBaseUrl = ref('');

const deployingToVercel = computed(() => vercelDeploymentRequest.status === 'pending');
const deployingToWordpress = computed(() => wordpressDeploymentRequest.status === 'pending');

const showVercelDeployView = ref(false);
const showWordpressDeployView = ref(false);

function handleDrawerClose() {
  if (hasVercelUnsavedChanges.value || hasWordpressUnsavedChanges.value) {
    pendingAction.value = () => {
      emit('close');
      resetDrawerState();
    };
    showUnsavedChangesModal.value = true;
    return;
  }

  emit('close');
  resetDrawerState();
}

function resetDrawerState() {
  showVercelDeployView.value = false;
  showWordpressDeployView.value = false;
  hasVercelUnsavedChanges.value = false;
  hasWordpressUnsavedChanges.value = false;

  vercelDeploymentRequest.status = 'idle';
  wordpressDeploymentRequest.status = 'idle';
}

function handleVercelUnsavedChanges(hasChanges: boolean) {
  hasVercelUnsavedChanges.value = hasChanges;
}

function handleWordpressUnsavedChanges(hasChanges: boolean) {
  hasWordpressUnsavedChanges.value = hasChanges;
}

function confirmUnsavedChanges() {
  showUnsavedChangesModal.value = false;
  if (pendingAction.value) {
    pendingAction.value();
    pendingAction.value = null;
  }
}

function cancelUnsavedChanges() {
  showUnsavedChangesModal.value = false;
  pendingAction.value = null;
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
      hasVercelUnsavedChanges.value = false;
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
      hasWordpressUnsavedChanges.value = false;
      if (response.data) {
        emit('project-updated', response.data || {});
      }
    })
    .catch((error) => wordpressDeploymentRequest.parseError(error));
}

function handleVercelDeployGoBack() {
  if (hasVercelUnsavedChanges.value) {
    pendingAction.value = () => {
      showVercelDeployView.value = false;
      hasVercelUnsavedChanges.value = false;
      vercelDeploymentRequest.status = 'idle';
    };
    showUnsavedChangesModal.value = true;
    return;
  }

  showVercelDeployView.value = false;
  vercelDeploymentRequest.status = 'idle';
}

function handleWordpressDeployGoBack() {
  if (hasWordpressUnsavedChanges.value) {
    pendingAction.value = () => {
      showWordpressDeployView.value = false;
      hasWordpressUnsavedChanges.value = false;
      wordpressDeploymentRequest.status = 'idle';
    };
    showUnsavedChangesModal.value = true;
    return;
  }

  showWordpressDeployView.value = false;
  wordpressDeploymentRequest.status = 'idle';
}

function showVercelDeploy() {
  initialVercelToken.value = projectVercelToken(props.project) || '';
  initialVercelProjectName.value = projectVercelName(props.project) || '';
  showVercelDeployView.value = true;
}

function showWordpressDeploy() {
  initialWordpressToken.value = projectWordpressToken(props.project) || '';
  initialWordpressBaseUrl.value = projectWordpressBaseUrl(props.project) || '';
  showWordpressDeployView.value = true;
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
        @has-unsaved-changes="handleVercelUnsavedChanges"
        :project="project"
        :deployment-request="vercelDeploymentRequest"
        :initial-token="initialVercelToken"
        :initial-project-name="initialVercelProjectName"
      />

      <DeployToWordpress
        v-else-if="showWordpressDeployView"
        @go-back="handleWordpressDeployGoBack"
        @deploy-start="handleDeployToWordpress"
        @has-unsaved-changes="handleWordpressUnsavedChanges"
        :project="project"
        :deployment-request="wordpressDeploymentRequest"
        :initial-token="initialWordpressToken"
        :initial-base-url="initialWordpressBaseUrl"
      />

      <div v-else>
        <PreviewDrawerExportDeployTab
          :deploying-to-vercel="deployingToVercel"
          :vercel-token="projectVercelToken(project)"
          :deploying-to-wordpress="deployingToWordpress"
          :wordpress-token="projectWordpressToken(project)"
          :wordpress-base-url="projectWordpressBaseUrl(project)"
          :project-name="projectVercelName(project)"
          @export-to-html="handleExportToHtml"
          @export-to-wordpress="handleExportToWordpress"
          @show-vercel-deploy="showVercelDeploy"
          @show-wordpress-deploy="showWordpressDeploy"
        />
      </div>
    </div>

    <DrawerConfirmationModal
      v-if="showUnsavedChangesModal"
      @confirm="confirmUnsavedChanges"
      @cancel="cancelUnsavedChanges"
    />
  </Drawer>
</template>
