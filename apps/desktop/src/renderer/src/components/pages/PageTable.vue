<script setup lang="ts">
import Button from '@/components/common/Button.vue';
import { Icon } from '@iconify/vue';
import { Page } from '@/@types';
import Loader from '@/components/common/Loader.vue';
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'radix-vue';
import { usePages } from '@/composables/usePages';
import { computed } from 'vue';

const {
  pageLastSyncedAt,
  pageHasPreview,
  pageIsSynchronizing,
  pageSyncComplete,
  pageFailedSynchronization,
  pageSynchronizeErrorTitle,
  pageSynchronizeErrorMessage,
} = usePages();

const props = defineProps({
  pages: {
    type: Array as () => Page[],
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const pages = computed(() =>
  [...props.pages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
);

const emit = defineEmits(['new', 'sync', 'preview', 'edit', 'delete', 'settings']);
</script>

<template>
  <div class="mt-12 px-6">
    <div v-if="props.loading" class="flex justify-center mt-32">
      <Loader size="xl" />
    </div>

    <div v-else>
      <div
        v-if="props.pages.length === 0"
        class="flex flex-col items-center justify-center py-24 mt-24"
      >
        <h2 class="text-xl text-gray-300 mb-6">
          You don't have any pages, let's import a new one.
        </h2>
        <Button @click="emit('new')">Add new page</Button>
      </div>

      <div v-else class="space-y-8">
        <div class="bg-[#1c2029] rounded-lg border border-[#252a35] overflow-hidden">
          <div
            class="flex justify-between items-center p-4 bg-gradient-to-r from-[#1a1e26] to-[#222831]"
          >
            <h3 class="text-white text-lg font-light flex-1">Pages</h3>

            <Button @click="$emit('new')" variant="primary" class="px-3">
              <Icon icon="material-symbols:add" /><span class="ms-2">Add Page</span>
            </Button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse border border-[#374151]">
              <colgroup>
                <col />
                <col class="w-1/3" />
                <col class="w-1/4" />
                <col />
              </colgroup>

              <thead>
                <tr class="bg-black text-gray-100 opacity-70">
                  <th
                    class="py-1 px-4 text-left text-xs font-extralight tracking-wider border border-[#374151]"
                  >
                    Home
                  </th>
                  <th
                    class="py-1 px-4 text-left text-xs font-extralight tracking-wider border border-[#374151]"
                  >
                    Route
                  </th>
                  <th
                    class="py-1 px-4 text-left text-xs font-extralight tracking-wider border border-[#374151]"
                  >
                    Last Sync
                  </th>
                  <th
                    class="py-1 px-4 text-left text-xs font-extralight tracking-wider border border-[#374151]"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="page in pages"
                  :key="page.id"
                  class="bg-[#0F1519] hover:bg-gray-950 transition-colors"
                >
                  <td class="py-2 px-4 text-gray-400 border border-[#374151]">
                    <div class="flex h-full items-center justify-center">
                      <Icon
                        v-if="page.homePage"
                        icon="material-symbols:home"
                        class="text-green-500"
                      />
                    </div>
                  </td>

                  <td
                    class="py-2 px-4 text-gray-400 border border-[#374151] break-all whitespace-normal"
                  >
                    <span>/</span>
                    <span>{{ page.path }}</span>
                  </td>

                  <td class="py-2 px-4 text-gray-400 border border-[#374151]">
                    <span>{{ pageLastSyncedAt(page) }}</span>

                    <AlertDialogRoot v-if="pageFailedSynchronization(page)">
                      <AlertDialogTrigger
                        class="text-red-400 shadow-sm inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] leading-none outline-none transition-all"
                      >
                        <Icon icon="material-symbols:error" />
                      </AlertDialogTrigger>
                      <AlertDialogPortal>
                        <AlertDialogOverlay
                          class="bg-blackA9 data-[state=open]:animate-overlayShow fixed inset-0 z-30"
                        />
                        <AlertDialogContent
                          class="z-[100] text-[15px] data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
                        >
                          <AlertDialogTitle class="text-mauve12 m-0 text-[17px] font-semibold">
                            {{ pageSynchronizeErrorTitle(page) }}
                          </AlertDialogTitle>
                          <AlertDialogDescription
                            class="text-mauve11 mt-4 mb-5 text-[15px] leading-normal"
                          >
                            {{ pageSynchronizeErrorMessage(page) }}
                          </AlertDialogDescription>
                          <div class="flex justify-end gap-[25px]">
                            <AlertDialogCancel
                              class="text-mauve11 bg-mauve4 hover:bg-mauve5 focus:shadow-mauve7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-semibold leading-none border border-[#252a35]"
                            >
                              Close
                            </AlertDialogCancel>
                          </div>
                        </AlertDialogContent>
                      </AlertDialogPortal>
                    </AlertDialogRoot>
                  </td>

                  <td class="py-2 px-4 text-gray-400 border border-[#374151]">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center space-x-3">
                        <Button
                          @click="() => emit('preview', page)"
                          variant="primary"
                          :disabled="
                            !pageHasPreview(page) ||
                            pageFailedSynchronization(page) ||
                            pageIsSynchronizing(page)
                          "
                          :class="{
                            'opacity-50 cursor-not-allowed':
                              !pageHasPreview(page) || pageFailedSynchronization(page),
                          }"
                        >
                          <Icon icon="material-symbols:visibility" />
                          <span class="ms-2">Preview</span>
                        </Button>

                        <Button
                          @click="() => emit('sync', page)"
                          :disabled="pageIsSynchronizing(page)"
                          variant="secondary"
                        >
                          <Icon
                            v-if="pageSyncComplete(page) && !pageIsSynchronizing(page)"
                            icon="material-symbols:check"
                            class="text-green-500 success-icon"
                          />
                          <Icon
                            v-else
                            icon="material-symbols:sync-rounded"
                            :class="[
                              'text-white',
                              { 'animate-spin text-green-500': pageIsSynchronizing(page) },
                            ]"
                          />
                          <span class="ms-2">Sync</span>
                        </Button>

                        <Button @click="() => emit('edit', page)" variant="secondary">
                          <Icon icon="material-symbols:edit" />
                          <span class="ms-2">Edit</span>
                        </Button>

                        <Button @click="() => emit('delete', page)" variant="secondary">
                          <Icon icon="material-symbols:delete" />
                          <span class="ms-2">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
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

.success-icon {
  transform: translateY(-1px);
}
</style>
