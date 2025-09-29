<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import { Project } from '@/@types';
import { useProjects } from '@/composables';
import { RequestStatus } from '@/entities';

const {
  projectVercelName,
  projectVercelToken,
  projectIsDeployingToVercel,
  projectVercelUrl,
  projectDeployToVercelFinished,
  projectDeployToVercelErrorMessage,
} = useProjects();

const emit = defineEmits<{
  (e: 'deploy-start', token: string, projectName: string): void;
  (e: 'go-back'): void;
  (e: 'has-unsaved-changes', hasChanges: boolean): void;
}>();

const props = defineProps<{
  project: Project;
  deploymentRequest: RequestStatus;
}>();

const projectName = ref<string>(projectVercelName(props.project));
const token = ref<string>(projectVercelToken(props.project));

const initialProjectName = ref<string>('');
const initialToken = ref<string>('');

const latestDeploymentUrl = computed(() => projectVercelUrl(props.project) || '');
const deployFinished = computed(() => projectDeployToVercelFinished(props.project));
const deployErrorMessage = computed(() => projectDeployToVercelErrorMessage(props.project));
const isDeployingGlobally = computed(() => projectIsDeployingToVercel(props.project));
const isDeployingLocally = computed(() => {
  return props.deploymentRequest?.pending ?? false;
});
const isDeploying = computed(() => isDeployingLocally.value || isDeployingGlobally.value);
const hasUnsavedChanges = computed<boolean>(() => {
  return projectName.value !== initialProjectName.value || token.value !== initialToken.value;
});

watch(
  hasUnsavedChanges,
  (newValue) => {
    emit('has-unsaved-changes', newValue);
  },
  { immediate: true },
);

onMounted(() => {
  initialProjectName.value = projectVercelName(props.project);
  initialToken.value = projectVercelToken(props.project);
});

function handleSubmitClick() {
  initialProjectName.value = projectName.value;
  initialToken.value = token.value;
  emit('deploy-start', token.value, projectName.value);
}

function handleGoBack() {
  emit('go-back');
}

function handleLatestDeploymentUrlClick() {
  window.open(latestDeploymentUrl.value, '_blank');
}
</script>

<template>
  <div class="flex flex-col gap-6 px-2">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <button
        @click="handleGoBack"
        class="h-8 w-8 text-gray-400 flex items-center justify-center rounded bg-gray-850 hover:bg-gray-800 transition-colors"
      >
        <Icon icon="mdi:chevron-left" class="text-gray-100" />
      </button>
      <h2 class="text-xl font-extralight text-gray-100 flex-1 text-center tracking-wide">
        Deploy to Vercel
      </h2>
      <div class="w-10"></div>
    </div>

    <div>
      <div class="flex flex-col gap-4">
        <Input
          v-model="projectName"
          placeholder="Enter Project name"
          label="Project Name"
          label-class="text-sm font-light"
          required
          class="w-full text-sm placeholder:text-gray-500"
          :errors="deploymentRequest.errors.projectName"
        />

        <Input
          v-model="token"
          placeholder="Enter access token"
          label="Vercel Access Token"
          label-class="text-sm font-light"
          required
          class="w-full text-sm placeholder:text-gray-500"
          :errors="deploymentRequest.errors.token"
        />
      </div>

      <div
        v-if="deployFinished"
        class="rounded-md border-1 border-[#394147] bg-transparent px-4 py-5 mt-8"
      >
        <div class="flex items-start gap-3">
          <div v-if="deployErrorMessage === ''" class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:arrow-upload-ready-rounded" class="text-xl" />
              <h3 class="text-gray-100">Latest Deployment URL</h3>
            </div>

            <Input
              v-model="latestDeploymentUrl"
              label-class="text-sm font-light"
              readonly
              action-button-icon="mdi:open-in-new"
              @action-button-click="handleLatestDeploymentUrlClick"
              class="w-full text-sm placeholder:text-gray-500"
            />
          </div>

          <div v-else class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:error-rounded" class="text-xl text-red-500" />
              <h3 class="text-gray-100">Latest Deploy Failed</h3>
            </div>

            <p class="text-sm text-gray-400 font-light">
              {{ deployErrorMessage }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-md border-1 border-[#394147] bg-transparent px-4 py-5 mt-8">
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:info-outline-rounded" class="text-xl text-blue-500" />
              <h3 class="text-gray-100">How to setup Vercel Project?</h3>
            </div>
            <p class="text-sm text-gray-400 font-light">
              To deploy your project to Vercel, first create a new project in your Vercel dashboard.
              Generate an access token with project deployment permissions. Enter your project name
              and access token above to connect your workspace. Vercel will automatically detect
              your framework and build settings.
            </p>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex justify-end gap-6 mt-8">
        <Button @click="handleGoBack" variant="secondary" class="px-4 py-2">Abort</Button>
        <Button
          @click="handleSubmitClick"
          :disabled="isDeploying"
          :class="isDeploying ? 'cursor-not-allowed' : 'cursor-pointer'"
          >{{ isDeploying ? 'Deploying...' : 'Deploy' }}</Button
        >
      </div>
    </div>
  </div>
</template>
