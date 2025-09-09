<template>
  <section class="text-[#E5E9ED] px-8 py-12 bg-[#0A0D10] min-h-[calc(100vh-64px)]">
    <div v-if="projectsRequest.pending" class="flex justify-center mt-32">
      <Loader size="xl" />
    </div>
    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center h-full">
      <div class="text-center mt-60">
        <h1 class="text-[24px] font-[300] tracking-[0.5px] mb-8">
          You don't have any projects, let's make a new one.
        </h1>
        <Button variant="primary" @click="showModal = true"> Create new project </Button>
      </div>
    </div>

    <div v-else>
      <div class="flex items-center justify-between">
        <div class="flex gap-4 items-center">
          <Icon icon="mdi:filter-variant" class="text-white w-5 h-5" />
          <h3>Projects</h3>
        </div>

        <div class="flex gap-8">
          <div class="relative flex cursor-pointer items-center gap-2 space-x-1">
            <Icon icon="mdi:sort" class="text-white w-5 h-5" />
            <span> recent </span>
            <Icon icon="mdi:chevron-down" class="text-white w-4 h-4" />
          </div>

          <Button variant="primary" @click="showModal = true">New project</Button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-8">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="relative rounded-xl border border-[#252a35] shadow-md bg-gradient-to-r from-transparent to-[#1c2029] hover:border-green-500 min-h-[250px] sm:min-h-[130px]"
          @click="goToProject(project.id)"
        >
          <div
            class="bg-no-repeat bg-cover rounded-xl h-full"
            :style="{ backgroundImage: `url(${patternSvg})` }"
          >
            <div class="flex justify-end p-2 relative">
              <Button variant="transparent" @click.stop="toggleDropdown(project.id)">
                <Icon icon="mdi:dots-vertical" class="text-white w-4 h-4" />
              </Button>
            </div>

            <div class="space-y-2 p-3 sm:space-y-3 sm:p-4">
              <h3 class="leading-snug break-words whitespace-pre-wrap">{{ project.name }}</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, i) in project.tags || []"
                  :key="i"
                  class="text-[10px] bg-[#1c2029] text-[#b4b6c3] border border-[#252a35] px-2 py-1 rounded-md sm:text-xs"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="openDropdownId === project.id"
            class="absolute w-48 bg-[#1c2029] border border-[#252a35] rounded-md shadow-lg z-30 top-10 right-2"
            @click.stop
          >
            <button
              @click="() => openEditModal(project)"
              class="block w-full text-left px-4 py-2 text-sm text-[#E5E9ED] hover:bg-[#252a35]"
            >
              Edit
            </button>
            <button
              @click="() => openDeleteModal(project)"
              class="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[#252a35]"
            >
              Delete
            </button>
          </div>
        </div>

        <div
          class="relative rounded-xl border border-[#252a35] shadow-md bg-gradient-to-r from-transparent to-[#1c2029] hover:border-green-500 flex items-center justify-center cursor-pointer min-h-[250px] sm:min-h-[130px]"
          :style="{
            backgroundImage: `url(${pattern2Svg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }"
          @click="showModal = true"
        >
          <Button variant="circular" size="md">
            <Icon icon="mdi:add" />
          </Button>
        </div>
      </div>
    </div>

    <NewProjectModal :open="showModal" @close="showModal = false" @created="fetchProjects" />
    <EditProjectModal
      v-if="showEditModal && selectedProject"
      :project="selectedProject"
      @close="showEditModal = false"
      @updated="fetchProjects"
    />
    <DeleteProjectModal
      v-if="showDeleteModal"
      @confirm="handleConfirmDelete"
      @cancel="showDeleteModal = false"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue';
import { backendClient } from '@/utils';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';
import Button from '@/components/common/Button.vue';
import Loader from '@/components/common/Loader.vue';
import NewProjectModal from '@/components/projects/NewProjectModal.vue';
import EditProjectModal from '@/components/projects/EditProjectModal.vue';
import DeleteProjectModal from '@/components/projects/DeleteProjectModal.vue';
import { Project } from '@/@types';
import { RequestStatus } from '@/entities';
import patternSvg from '@/assets/pattern.svg#file';
import pattern2Svg from '@/assets/pattern-2.svg#file';

const router = useRouter();

const projects = ref<Project[]>([]);
const showModal = ref(false);
const showEditModal = ref(false);
const openDropdownId = ref<number | undefined>(undefined);
const showDeleteModal = ref(false);
const selectedProject = ref<Project | undefined>(undefined);
const projectsRequest = reactive(new RequestStatus());
const projectsWsClient = backendClient.projectsWs();

const goToProject = (projectId) => {
  void router.push(`/projects/${projectId}`);
};

const fetchProjects = () => {
  projectsRequest.status = 'pending';

  backendClient
    .projectsFetchAll()
    .then((response) => {
      projectsRequest.status = 'success';

      if (Array.isArray(response.data)) {
        projects.value = response.data;
      }
    })
    .catch((error) => projectsRequest.parseError(error));
};

const toggleDropdown = (projectId: number) => {
  openDropdownId.value = openDropdownId.value === projectId ? undefined : projectId;
};

const closeDropdown = () => {
  openDropdownId.value = undefined;
};

const filteredProjects = computed(() => projects.value);

function openEditModal(project: Project) {
  selectedProject.value = project;
  showEditModal.value = true;
  closeDropdown();
}

function openDeleteModal(project: Project) {
  selectedProject.value = project;
  showDeleteModal.value = true;
  closeDropdown();
}

const handleConfirmDelete = async () => {
  if (selectedProject.value) {
    await backendClient.projectsDestroy(selectedProject.value.id);
    showDeleteModal.value = false;
    selectedProject.value = undefined;
    fetchProjects();
  }
};

onMounted(() => {
  fetchProjects();

  projectsWsClient.connect();
  projectsWsClient.on(`create`, (data: { project: Project }) => {
    handleProjectCreated(data.project);
  });

  projectsWsClient.on(`update`, (data: { project: Project }) => {
    handleProjectUpdated(data.project);
  });

  projectsWsClient.on(`delete`, (data: { project: Project }) => {
    handleProjectDeleted(data.project);
  });

  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

function handleProjectCreated(createdProject: Project) {
  const existingProject = projects.value.find((p) => p.id === createdProject.id);

  if (existingProject) {
    handleProjectUpdated(createdProject);
  } else {
    projects.value.push(createdProject);
  }
}

function handleProjectUpdated(updatedProject: Project) {
  projects.value.forEach((existingProject) => {
    if (existingProject.id === updatedProject.id) {
      Object.assign(existingProject, updatedProject);
    }
  });
}

function handleProjectDeleted(deletedProject: Project) {
  projects.value = projects.value.filter((p) => p.id !== deletedProject.id);
}
</script>

<style scoped></style>
