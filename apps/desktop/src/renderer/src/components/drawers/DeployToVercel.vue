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
  projectVercelName,
  projectVercelToken,
  projectVercelUrl,
  projectIsDeployingToVercel,
  projectDeployToVercelComplete,
  projectDeployToVercelSuccess,
  projectDeployToVercelErrorTitle,
  projectDeployToVercelErrorMessage,
} = useProjects();

const emit = defineEmits<{
  (e: 'deploy-start', token: string, projectName: string): void;
  (e: 'go-back'): void;
}>();

const props = defineProps<{
  project: Project;
  deploymentRequest: RequestStatus;
}>();

const projectName = ref<string>(projectVercelName(props.project));
const token = ref<string>(projectVercelToken(props.project));
const setupAgain = ref<boolean>(false);
const showDeploymentStatus = computed<boolean>(() => {
  if (setupAgain.value) return false;

  return projectIsDeployingToVercel(props.project) || projectDeployToVercelComplete(props.project);
});

function visitWebsite() {
  window.open(projectVercelUrl(props.project), '_blank');
}

function handleSubmitClick() {
  setupAgain.value = false;

  emit('deploy-start', token.value, projectName.value);
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
        Deploy to Vercel
      </h2>
      <div class="w-10"></div>
    </div>

    <!-- Deployment Status Screen -->
    <DeploymentStatus
      v-if="showDeploymentStatus"
      :project="project"
      :deploying="deploymentRequest.pending || projectIsDeployingToVercel(props.project)"
      :deploy-successful="projectDeployToVercelSuccess(project)"
      :error-title="projectDeployToVercelErrorTitle(project)"
      :error-description="projectDeployToVercelErrorMessage(project)"
      @dismiss="setupAgain = true"
      @visit="visitWebsite"
    />

    <div v-else>
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

      <div class="rounded-md border-1 border-[#394147] bg-transparent p-4 mt-5 py-5">
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-2">
              <Icon icon="material-symbols:info-outline-rounded" class="text-xl text-gray-400" />
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
