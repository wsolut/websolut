<script setup lang="ts">
import { computed } from 'vue';
import { Separator, SwitchRoot, SwitchThumb } from 'radix-vue';
import { Icon } from '@iconify/vue';
import { Page } from '@/@types';
import { usePages } from '@/composables';

const props = defineProps<{
  page: Page;
  editMode: boolean;
  hasUncommittedChanges: boolean;
}>();

const { pageSyncComplete, pageIsSynchronizing } = usePages();

const emit = defineEmits(['toggle-edit-mode', 'update-content', 'revert-content', 'sync']);

const synchronizing = computed(() => pageIsSynchronizing(props.page));
const syncComplete = computed(() => pageSyncComplete(props.page));

function handleResync() {
  if (!pageIsSynchronizing(props.page) && !pageSyncComplete(props.page)) {
    emit('sync');
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Edit Mode -->
    <div
      class="flex justify-between items-center p-4 bg-[#232E36] rounded-md border-1 border-[#394147]"
    >
      <div class="flex items-center">
        <Icon icon="material-symbols:edit-square-outline" class="text-[32px] mr-4 text-gray-100" />
        <div class="text-left">
          <div class="text-lg font-light">Edit Mode</div>
          <div class="text-sm font-light text-gray-400">Enable editing</div>
        </div>
      </div>
      <SwitchRoot
        :checked="editMode"
        @update:checked="emit('toggle-edit-mode')"
        class="w-[50px] h-[30px] focus:outline-none bg-gray-600 rounded-full relative data-[state=checked]:bg-green-600 transition-colors"
      >
        <SwitchThumb
          class="block w-[26px] h-[26px] bg-gray-200 rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]"
        />
      </SwitchRoot>
    </div>

    <!-- Re-sync Button -->
    <button
      class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors relative"
      @click="handleResync"
      :disabled="synchronizing || syncComplete"
      :class="{
        'opacity-70 cursor-not-allowed': synchronizing || syncComplete,
        'hover:bg-[#232E36]': synchronizing || syncComplete,
      }"
    >
      <div class="flex items-center">
        <Icon
          v-if="syncComplete"
          icon="material-symbols:check"
          class="text-[32px] mr-4 text-gray-100"
        />
        <Icon
          v-else
          icon="material-symbols:sync-rounded"
          :class="['text-[32px] mr-4', { 'animate-spin': synchronizing }]"
        />
        <div class="text-left">
          <div class="text-lg font-light transition-all duration-300">
            {{ syncComplete ? 'Synced!' : 'Re-sync' }}
          </div>
          <div class="text-sm font-light text-gray-400">Keep project up to date</div>
        </div>
      </div>
    </button>

    <!-- Uncommitted Changes -->
    <div v-if="hasUncommittedChanges" class="flex flex-col gap-6">
      <button
        class="rounded-md bg-[#232E36] border-1 border-[#394147] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="emit('update-content')"
      >
        <Icon icon="material-symbols:save-rounded" class="text-[32px] mr-4 text-gray-100" />
        <div class="text-left">
          <div class="text-lg font-light">Commit</div>
          <div class="text-sm font-light text-gray-400">Save changes</div>
        </div>
      </button>
    </div>

    <!-- Committed Changes -->
    <div v-if="page.hasCommittedChanges" class="flex flex-col gap-6">
      <div class="relative flex items-center">
        <Separator class="flex-1 bg-gray-600 h-px" />
        <span class="px-3 text-sm text-gray-400 tracking-wider">Previous Changes</span>
        <Separator class="flex-1 bg-gray-600 h-px" />
      </div>

      <button
        class="rounded-md bg-gray-800 hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
        @click="emit('revert-content')"
      >
        <Icon icon="material-symbols:undo" class="text-[32px] mr-4 text-gray-100" />
        <div class="text-left">
          <div class="text-lg font-light">Discard all</div>
          <div class="text-sm text-gray-400">Revert committed changes</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
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
</style>
