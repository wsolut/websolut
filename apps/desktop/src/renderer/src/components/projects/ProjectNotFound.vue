<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from '@/components/common/Button.vue';
import { Icon } from '@iconify/vue';
import { ref, onMounted } from 'vue';

const router = useRouter();
const hasHistory = ref(false);

onMounted(() => {
  hasHistory.value = window.history.length > 1;
});

function goToProjects() {
  void router.push('/projects');
}

function goBack() {
  if (hasHistory.value) {
    void router.back();
  } else {
    goToProjects();
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen text-center space-y-6">
    <h2 class="text-2xl text-white font-semibold">Project Not Found</h2>
    <p class="text-gray-400 max-w-md">
      The project you’re trying to access doesn’t exist or may have been deleted.
    </p>

    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button variant="secondary" @click="goBack"> Stay on Page </Button>

      <Button variant="primary" @click="goToProjects">
        <Icon icon="mdi:arrow-left" class="mr-2" />
        Go Back to Projects
      </Button>
    </div>
  </div>
</template>
