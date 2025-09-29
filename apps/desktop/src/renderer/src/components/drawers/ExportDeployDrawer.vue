<template>
  <Drawer :is-open="isOpen" @close="handleDrawerClose">
    <template #header> Export/Deploy </template>

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
      v-else-if="showWordpressDeployView"
      @go-back="handleWordpressDeployGoBack"
      @deploy-start="handleDeployToWordpress"
      @dismiss-deployment-status="showWordpressDeploymentStatus = false"
      @reset-deployment-request="handleResetWordpressRequest"
      :project="project"
      :deployment-request="wordpressDeploymentRequest"
      :show-deployment-status="showWordpressDeploymentStatus"
    />

    <div v-else class="flex flex-col gap-6">
      <!-- Export Static Page -->
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
      <!-- Export WordPress Plugin -->
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
      <!-- Deploy to Vercel -->
      <button
        class="mt-8 rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="showVercelDeployView = true"
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

      <!-- Deploy to WordPress -->
      <button
        class="mt-8 rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="showWordpressDeployView = true"
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
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { backendClient } from '@/utils';
import { Project } from '@/@types';
import Drawer from '@/components/common/Drawer.vue';
import DeployToVercel from '@/components/drawers/DeployToVercel.vue';
import DeployToWordpress from '@/components/drawers/DeployToWordpress.vue';
import { Icon } from '@iconify/vue';
import { RequestStatus } from '@/entities';

const emit = defineEmits(['close', 'project-updated']);

const props = defineProps<{
  project: Project;
  isOpen: boolean;
}>();

const showVercelDeployView = ref(false);
const showVercelDeploymentStatus = ref(false);
const showWordpressDeployView = ref(false);
const showWordpressDeploymentStatus = ref(false);
const vercelDeploymentRequest = reactive(new RequestStatus());
const wordpressDeploymentRequest = reactive(new RequestStatus());
const deployingToVercel = computed(() => vercelDeploymentRequest.status === 'pending');
const deployingToWordpress = computed(() => wordpressDeploymentRequest.status === 'pending');

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
