<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import DeploymentStatus from '@/components/drawers/DeploymentStatus.vue';
import { Project } from '@/@types';
import { useProjects } from '@/composables';
import { RequestStatus } from '@/entities';

const {
  projectWordpressBaseUrl,
  projectWordpressToken,
  projectWordpressUrl,
  projectIsDeployingToWordpress,
  projectDeployToWordpressComplete,
  projectDeployToWordpressSuccess,
  projectDeployToWordpressErrorTitle,
  projectDeployToWordpressErrorMessage,
} = useProjects();

const emit = defineEmits<{
  (e: 'deploy-start', token: string, baseUrl: string): void;
  (e: 'go-back'): void;
}>();

const props = defineProps<{
  project: Project;
  deploymentRequest: RequestStatus;
}>();

const baseUrl = ref<string>(projectWordpressBaseUrl(props.project));
const token = ref<string>(projectWordpressToken(props.project));
const setupAgain = ref<boolean>(false);
const showDeploymentStatus = computed<boolean>(() => {
  if (setupAgain.value) return false;

  return (
    projectIsDeployingToWordpress(props.project) || projectDeployToWordpressComplete(props.project)
  );
});

function visitWebsite() {
  window.open(projectWordpressUrl(props.project), '_blank');
}

function handleSubmitClick() {
  setupAgain.value = false;

  emit('deploy-start', token.value, baseUrl.value);
}
</script>

<template>
  <div class="flex flex-col gap-6 px-2">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <button
        @click="emit('go-back')"
        class="h-8 w-8 text-gray-400 flex items-center justify-center rounded bg-gray-850 hover:bg-gray-800 transition-colors"
      >
        <Icon icon="mdi:chevron-left" class="text-gray-100" />
      </button>
      <h2 class="text-xl font-extralight text-gray-100 flex-1 text-center tracking-wide">
        Deploy to Wordpress
      </h2>
      <div class="w-10"></div>
    </div>

    <!-- Deployment Status Screen -->
    <DeploymentStatus
      v-if="showDeploymentStatus"
      :project="project"
      :deploying="deploymentRequest.pending || projectIsDeployingToWordpress(props.project)"
      :deploy-successful="projectDeployToWordpressSuccess(project)"
      :error-title="projectDeployToWordpressErrorTitle(project)"
      :error-description="projectDeployToWordpressErrorMessage(project)"
      @dismiss="setupAgain = true"
      @visit="visitWebsite"
    />

    <div v-else>
      <div class="flex flex-col gap-4">
        <Input
          v-model="baseUrl"
          label="Base URL"
          placeholder="Enter Base URL"
          class="w-full"
          :errors="deploymentRequest.errors.baseUrl"
        />

        <Input
          v-model="token"
          label="WordPress Access Token"
          placeholder="Enter access token"
          class="w-full"
          :errors="deploymentRequest.errors.token"
        />
      </div>

      <div class="rounded-md border-1 border-[#394147] bg-transparent p-4 mt-5 py-5">
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-2">
              <Icon icon="material-symbols:info-outline-rounded" class="text-xl text-gray-400" />
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
        <Button @click="emit('go-back')" variant="secondary" class="px-4 py-2">Abort</Button>
        <Button
          @click="handleSubmitClick"
          variant="primary"
          class="px-4 py-2"
          :disabled="deploymentRequest.pending"
          >{{ deploymentRequest.pending ? 'Deploying...' : 'Deploy' }}</Button
        >
      </div>
    </div>
  </div>
</template>
