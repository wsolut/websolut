<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { backendClient } from '@/utils';
import Button from '@/components/common/Button.vue';
import CloseButton from '@/components/common/CloseButton.vue';
import { RequestStatus } from '@/entities';
import { Page } from '@/@types';

const props = defineProps<{
  pageId: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported', page: Page): void;
}>();

const request = new RequestStatus();
const requestState = ref(request);
const isDragging = ref(false);
const fileName = ref<string | null>(null);
const fileError = ref<string | null>(null);
let parsedJson: object | null = null;

// ─── keyboard ────────────────────────────────────────────────────────────────
const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close');
};
onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

// ─── drag-and-drop ────────────────────────────────────────────────────────────
function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}
function onDragLeave() {
  isDragging.value = false;
}
function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}
function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadFile(file);
}

function loadFile(file: File) {
  fileError.value = null;
  parsedJson = null;
  fileName.value = null;

  if (!file.name.endsWith('.json')) {
    fileError.value = 'Please drop a .json file exported by the Websolut Figma plugin.';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      parsedJson = JSON.parse(ev.target?.result as string);
      fileName.value = file.name;
    } catch {
      fileError.value = 'Could not parse JSON file. Make sure it was exported by the Websolut plugin.';
    }
  };
  reader.readAsText(file);
}

// ─── import ──────────────────────────────────────────────────────────────────
async function doImport() {
  if (!parsedJson) return;

  requestState.value.status = 'pending';
  fileError.value = null;

  try {
    const res = await backendClient.pagesSynchronizeJson(props.pageId, parsedJson);
    requestState.value.status = 'success';
    if (res.data) emit('imported', res.data);
    emit('close');
  } catch (err) {
    requestState.value.parseError(err);
    fileError.value = requestState.value.errors?.['_']?.[0] ?? 'Import failed.';
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-end">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-md" @click="$emit('close')" />

    <div
      class="relative w-full max-w-[600px] min-w-[450px] h-full bg-[#151D23] overflow-y-auto shadow-xl"
    >
      <div class="flex flex-col h-full p-8 text-white">
        <div class="flex justify-end">
          <CloseButton @click="$emit('close')" class="mb-4" />
        </div>

        <header class="text-center mb-10">
          <h1 class="text-lg font-extralight">Import from Plugin JSON</h1>
          <p class="text-sm text-gray-400 mt-2 font-extralight">
            Drop the <code>.json</code> file exported by the
            <strong class="text-white font-normal">Websolut Exporter</strong> Figma plugin.
          </p>
        </header>

        <!-- Drop zone -->
        <div
          class="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors cursor-pointer mx-4"
          :class="[
            isDragging
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-600 hover:border-gray-400',
          ]"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @click="($refs.fileInput as HTMLInputElement).click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="onFileInput"
          />

          <div class="text-center px-8 py-12 select-none pointer-events-none">
            <!-- Icon -->
            <svg
              class="mx-auto mb-4 text-gray-500"
              :class="{ 'text-blue-400': isDragging || fileName }"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>

            <p v-if="fileName" class="text-sm font-medium text-green-400">
              ✓ {{ fileName }}
            </p>
            <template v-else>
              <p class="text-sm text-gray-300">
                Drag &amp; drop your <code>.json</code> file here
              </p>
              <p class="text-xs text-gray-500 mt-1">or click to browse</p>
            </template>
          </div>
        </div>

        <!-- Error -->
        <p v-if="fileError" class="mt-4 text-sm text-red-400 text-center">
          {{ fileError }}
        </p>

        <footer class="flex justify-end gap-3 pt-6 mt-6">
          <Button type="button" variant="secondary" @click="$emit('close')">Cancel</Button>
          <Button
            type="button"
            variant="primary"
            :disabled="!fileName || requestState.pending"
            @click="doImport"
          >
            {{ requestState.pending ? 'Importing…' : 'Import' }}
          </Button>
        </footer>
      </div>
    </div>
  </div>
</template>
