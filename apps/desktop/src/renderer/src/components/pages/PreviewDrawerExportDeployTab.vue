<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineEmits([
  'export-to-html',
  'export-to-wordpress',
  'show-vercel-deploy',
  'show-wordpress-deploy',
]);
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Export Static Page -->
    <button
      class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('export-to-html')"
    >
      <div class="flex items-center w-full">
        <Icon
          icon="material-symbols:code-blocks-outline-rounded"
          class="text-[32px] mr-4 text-gray-100"
        />
        <div class="text-left flex-1">
          <div class="text-lg font-light">Export static page</div>
          <div class="text-sm font-light text-gray-400">HTML, CSS and JS files</div>
        </div>
        <Icon
          icon="material-symbols:download-for-offline-outline-rounded"
          class="text-[24px] text-gray-400"
        />
      </div>
    </button>
    <!-- Export WordPress Plugin -->
    <button
      class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('export-to-wordpress')"
    >
      <div class="flex items-center w-full">
        <Icon icon="ic:round-wordpress" class="text-[32px] mr-4 text-gray-100" />
        <div class="text-left flex-1">
          <div class="text-lg font-light">Export to WordPress</div>
          <div class="text-sm font-light text-gray-400">Export WordPress plugin</div>
        </div>
        <Icon
          icon="material-symbols:download-for-offline-outline-rounded"
          class="text-[24px] text-gray-400"
        />
      </div>
    </button>
    <!-- Deploy to Vercel -->
    <button
      class="mt-8 rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('show-vercel-deploy')"
    >
      <div class="flex items-center w-full">
        <Icon icon="simple-icons:vercel" class="text-[32px] mr-4 text-gray-100" />
        <div class="text-left flex-1">
          <div class="text-lg font-light">Deploy to Vercel</div>
          <div class="text-sm font-light text-gray-400">Release your static website</div>
        </div>
        <Icon icon="material-symbols:chevron-right-rounded" class="text-[24px] text-gray-400" />
      </div>
    </button>
    <!-- Deploy to WordPress -->
    <button
      class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('show-wordpress-deploy')"
    >
      <div class="flex items-center w-full">
        <Icon icon="ic:round-wordpress" class="text-[32px] mr-4 text-gray-100" />
        <div class="text-left flex-1">
          <div class="text-lg font-light">Deploy to WordPress</div>
          <div class="text-sm font-light text-gray-400">Release your dynamic website</div>
        </div>
        <Icon icon="material-symbols:chevron-right-rounded" class="text-[24px] text-gray-400" />
      </div>
    </button>
  </div>
</template>
