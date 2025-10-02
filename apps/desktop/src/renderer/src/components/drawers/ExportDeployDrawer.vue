<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { backendClient } from '@/utils';
import { Project } from '@/@types';
import Drawer from '@/components/common/Drawer.vue';
import DeployToVercel from '@/components/drawers/DeployToVercel.vue';
import DeployToWordpress from '@/components/drawers/DeployToWordpress.vue';
import { Icon } from '@iconify/vue';
import { RequestStatus } from '@/entities';
import DrawerConfirmationModal from '../modals/DrawerConfirmationModal.vue';
import { useToast } from '@/composables';
import { useProjects } from '@/composables';

const { projectVercelToken, projectVercelName, projectWordpressToken, projectWordpressBaseUrl } =
  useProjects();

const emit = defineEmits(['close', 'project-updated']);

const props = defineProps<{
  project: Project;
  isOpen: boolean;
}>();

const vercelDeploymentRequest = reactive(new RequestStatus());
const wordpressDeploymentRequest = reactive(new RequestStatus());

const deployingToVercel = computed(() => vercelDeploymentRequest.status === 'pending');
const deployingToWordpress = computed(() => wordpressDeploymentRequest.status === 'pending');

const showUnsavedChangesModal = ref(false);
const hasVercelUnsavedChanges = ref(false);
const hasWordpressUnsavedChanges = ref(false);
const pendingAction = ref<(() => void) | null>(null);
const showVercelDeployView = ref(false);
const showWordpressDeployView = ref(false);

const initialVercelToken = ref('');
const initialVercelProjectName = ref('');
const initialWordpressToken = ref('');
const initialWordpressBaseUrl = ref('');

const toast = useToast();

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
      toast.success('Project deployed to Vercel successfully!');
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
      toast.success('Project deployed to WordPress successfully!');
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
  <Drawer :is-open="isOpen" @close="handleDrawerClose">
    <template #header> Export/Deploy </template>

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

    <div v-else class="flex flex-col gap-6">
      <button
        class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="handleExportToHtml"
      >
        <div class="flex items-center w-full">
          <Icon
            icon="material-symbols:code-blocks-outline-rounded"
            class="text-[32px] mr-4 text-gray-100"
          />
          <div class="text-left flex-1">
            <div class="text-lg font-light">Export static page</div>
            <div class="text-sm font-light text-gray-400">HTML, CSS and JS files</div>
          </div>
          <Icon
            icon="material-symbols:download-for-offline-outline-rounded"
            class="text-[24px] text-gray-400"
          />
        </div>
      </button>

      <button
        class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="handleExportToWordpress"
      >
        <div class="flex items-center w-full">
          <Icon icon="ic:round-wordpress" class="text-[32px] mr-4 text-gray-100" />
          <div class="text-left flex-1">
            <div class="text-lg font-light">Export to WordPress</div>
            <div class="text-sm font-light text-gray-400">Export WordPress plugin</div>
          </div>
          <Icon
            icon="material-symbols:download-for-offline-outline-rounded"
            class="text-[24px] text-gray-400"
          />
        </div>
      </button>

      <button
        class="mt-8 rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="showVercelDeploy"
        :disabled="deployingToVercel"
      >
        <Icon icon="simple-icons:vercel" class="text-[32px] mr-4 text-gray-100 flex-shrink-0" />
        <div class="text-left flex-1 min-w-0">
          <div class="text-lg font-light">Deploy to Vercel</div>
          <div class="text-sm font-light text-gray-400">
            <span v-if="deployingToVercel">Deploying…</span>
            <span v-else>Release your static website</span>
          </div>
        </div>
        <Icon
          icon="material-symbols:chevron-right-rounded"
          class="text-[24px] text-gray-400 flex-shrink-0 ml-2"
        />
      </button>

      <button
        class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="showWordpressDeploy"
        :disabled="deployingToWordpress"
      >
        <Icon icon="ic:round-wordpress" class="text-[32px] mr-4 text-gray-100 flex-shrink-0" />
        <div class="text-left flex-1 min-w-0">
          <div class="text-lg font-light">Deploy to WordPress</div>
          <div class="text-sm font-light text-gray-400">
            <span v-if="deployingToWordpress">Deploying…</span>
            <span v-else>Release your dynamic website</span>
          </div>
        </div>
        <Icon
          icon="material-symbols:chevron-right-rounded"
          class="text-[24px] text-gray-400 flex-shrink-0 ml-2"
        />
      </button>
    </div>

    <DrawerConfirmationModal
      v-if="showUnsavedChangesModal"
      @confirm="confirmUnsavedChanges"
      @cancel="cancelUnsavedChanges"
    />
  </Drawer>
</template>
