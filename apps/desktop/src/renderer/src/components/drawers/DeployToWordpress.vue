<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import { Project } from '@/@types';
import { useProjects } from '@/composables';
import { RequestStatus } from '@/entities';

const {
  projectWordpressBaseUrl,
  projectWordpressToken,
  projectIsDeployingToWordpress,
  projectWordpressUrl,
  projectDeployToWordpressErrorMessage,
} = useProjects();

const emit = defineEmits<{
  (e: 'deploy-start', token: string, baseUrl: string): void;
  (e: 'go-back'): void;
  (e: 'has-unsaved-changes', hasChanges: boolean): void;
}>();

const props = defineProps<{
  project: Project;
  deploymentRequest: RequestStatus;
}>();

const baseUrl = ref<string>(projectWordpressBaseUrl(props.project));
const token = ref<string>(projectWordpressToken(props.project));
const initialBaseUrl = ref<string>('');
const initialToken = ref<string>('');

const latestDeploymentUrl = computed(() => projectWordpressUrl(props.project) || '');
const deployErrorMessage = computed(() => projectDeployToWordpressErrorMessage(props.project));
const isDeployingGlobally = computed(() => projectIsDeployingToWordpress(props.project));
const isDeployingLocally = computed(() => {
  return props.deploymentRequest?.pending ?? false;
});
const isDeploying = computed(() => isDeployingLocally.value || isDeployingGlobally.value);
const hasUnsavedChanges = computed<boolean>(() => {
  return baseUrl.value !== initialBaseUrl.value || token.value !== initialToken.value;
});

watch(
  hasUnsavedChanges,
  (newValue) => {
    emit('has-unsaved-changes', newValue);
  },
  { immediate: true },
);

onMounted(() => {
  initialBaseUrl.value = projectWordpressBaseUrl(props.project);
  initialToken.value = projectWordpressToken(props.project);
});

function handleSubmitClick() {
  initialBaseUrl.value = baseUrl.value;
  initialToken.value = token.value;
  emit('deploy-start', token.value, baseUrl.value);
}

function handleGoBack() {
  emit('go-back');
}

function handleLatestDeploymentUrlClick() {
  window.open(latestDeploymentUrl.value, '_blank');
}
</script>

<template>
  <div class="flex flex-col px-2">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <button
        @click="handleGoBack"
        class="h-8 w-8 text-gray-400 flex items-center justify-center rounded bg-gray-850 hover:bg-gray-800 transition-colors"
      >
        <Icon icon="mdi:chevron-left" class="text-gray-100" />
      </button>
      <h2 class="text-xl font-extralight text-gray-100 flex-1 text-center tracking-wide">
        Deploy to Wordpress
      </h2>
      <div class="w-10"></div>
    </div>

    <div>
      <div class="flex flex-col gap-4">
        <Input
          v-model="baseUrl"
          placeholder="Enter Base URL"
          label="Base URL"
          label-class="text-sm font-light"
          required
          class="w-full text-sm placeholder:text-gray-500"
          :errors="deploymentRequest.errors.baseUrl"
        />

        <Input
          v-model="token"
          placeholder="Enter access token"
          label="Access Token"
          label-class="text-sm font-light"
          required
          class="w-full text-sm placeholder:text-gray-500"
          :errors="deploymentRequest.errors.token"
        />
      </div>

      <div
        v-if="latestDeploymentUrl !== '' || deployErrorMessage !== ''"
        class="rounded-md border-1 border-[#394147] bg-transparent px-4 py-5 mt-8"
      >
        <div class="flex items-start gap-3">
          <div v-if="latestDeploymentUrl !== ''" class="flex-1">
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

          <div v-if="deployErrorMessage !== ''" class="flex-1">
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
              <h3 class="text-gray-100">How to setup Wordpress Plugin?</h3>
            </div>
            <p class="text-sm text-gray-400 font-light">
              Please refer to the setup instructions provided with the WordPress plugin to get the
              correct Base URL and Access Token.
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
