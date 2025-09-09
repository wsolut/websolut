<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Button from '@/components/common/Button.vue';

defineProps({
  synchronizing: Boolean,
  syncComplete: Boolean,
  isDrawerOpen: Boolean,
});

const emit = defineEmits(['toggle-drawer', 'sync']);
</script>

<template>
  <div class="fixed bottom-6 right-6 flex flex-col gap-4 items-end">
    <Button
      variant="circular"
      size="md"
      class="bg-black/20 backdrop-blur-md hover:bg-gray-600"
      :aria-label="synchronizing ? 'Synchronizing...' : syncComplete ? 'Success!' : 'Sync'"
      :disabled="synchronizing"
      @click="emit('sync')"
      :data-sync="syncComplete ? 'complete' : ''"
    >
      <div class="icon-container">
        <Icon icon="material-symbols:check" class="text-green-500 success-icon" />
        <Icon
          icon="material-symbols:sync-rounded"
          :class="['text-white sync-icon', { 'animate-spin text-green-500': synchronizing }]"
        />
      </div>
    </Button>

    <Button
      variant="circular"
      size="md"
      class="bg-black/20 backdrop-blur-md hover:bg-gray-600"
      :aria-label="isDrawerOpen ? 'Close Preview' : 'Open Preview'"
      @click="emit('toggle-drawer')"
    >
      <Icon icon="mdi:cog" class="text-white" />
    </Button>
  </div>
</template>

<style scoped>
.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  height: 1em;

  .success-icon {
    display: none;
  }
  .sync-icon {
    display: block;
  }
}

button[data-sync='complete'] {
  .success-icon {
    display: block;
  }
  .sync-icon {
    display: none;
  }

  &:hover {
    .success-icon {
      display: none;
    }
    .sync-icon {
      display: block;
    }
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.success-icon {
  transform: translateY(-1px);
}
</style>
