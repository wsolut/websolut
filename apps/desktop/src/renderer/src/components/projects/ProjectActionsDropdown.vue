<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const router = useRouter();
const openProjectDropdown = ref(false);

function toggleProjectDropdown(e: Event) {
  e.stopPropagation();
  openProjectDropdown.value = !openProjectDropdown.value;
}

function handleClickOutside(event: Event) {
  if (!(event.target as Element)?.closest('.project-dropdown-container')) {
    openProjectDropdown.value = false;
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

defineEmits(['edit-project', 'delete-project']);
</script>

<template>
  <div class="relative project-dropdown-container">
    <button @click="toggleProjectDropdown" class="text-white p-2 bg-gray-800 rounded-sm transition">
      <Icon icon="mdi:dots-vertical" class="h-6 w-6 text-gray-400" />
    </button>

    <div
      v-if="openProjectDropdown"
      class="absolute w-48 bg-[#1c2029] border border-[#252a35] shadow-lg z-30 right-0 mt-0.5 rounded-sm"
      @click.stop
    >
      <button
        @click="$emit('edit-project')"
        class="block w-full text-left px-4 py-2 text-sm text-[#E5E9ED] hover:bg-[#252a35]"
      >
        Edit Project
      </button>
      <button
        @click="router.push('/projects')"
        class="block w-full text-left px-4 py-2 text-sm text-[#E5E9ED] hover:bg-[#252a35]"
      >
        Back to Projects
      </button>
      <button
        @click="$emit('delete-project')"
        class="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[#252a35]"
      >
        Delete Project
      </button>
    </div>
  </div>
</template>
