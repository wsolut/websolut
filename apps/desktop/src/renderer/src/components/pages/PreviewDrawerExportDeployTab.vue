<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps<{
  deployingToVercel: boolean;
  vercelToken: string;
  deployingToWordpress: boolean;
  wordpressToken: string;
  wordpressBaseUrl: string;
  projectName: string;
}>();

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
      <Icon
        icon="material-symbols:code-blocks-outline-rounded"
        class="text-[32px] mr-4 text-gray-100 flex-shrink-0"
      />
      <div class="text-left flex-1 min-w-0">
        <div class="text-lg font-light">Export static page</div>
        <div class="text-sm font-light text-gray-400">HTML, CSS and JS files</div>
      </div>
      <Icon
        icon="material-symbols:download-for-offline-outline-rounded"
        class="text-[24px] text-gray-400 flex-shrink-0 ml-2"
      />
    </button>

    <!-- Export WordPress Plugin -->
    <button
      class="rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('export-to-wordpress')"
    >
      <Icon icon="ic:round-wordpress" class="text-[32px] mr-4 text-gray-100 flex-shrink-0" />
      <div class="text-left flex-1 min-w-0">
        <div class="text-lg font-light">Export to WordPress</div>
        <div class="text-sm font-light text-gray-400">Export WordPress plugin</div>
      </div>
      <Icon
        icon="material-symbols:download-for-offline-outline-rounded"
        class="text-[24px] text-gray-400 flex-shrink-0 ml-2"
      />
    </button>

    <!-- Deploy to Vercel -->
    <button
      class="mt-8 rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('show-vercel-deploy')"
      :disabled="deployingToVercel"
    >
      <Icon icon="simple-icons:vercel" class="text-[32px] mr-4 text-gray-100 flex-shrink-0" />
      <div class="text-left flex-1 min-w-0">
        <div class="text-lg font-light">Deploy to Vercel</div>
        <div class="text-sm font-light text-gray-400">
          <span v-if="deployingToVercel">Deploying…</span>
          <span v-else>Release your static website</span>
        </div>
      </div>
      <Icon
        icon="material-symbols:chevron-right-rounded"
        class="text-[24px] text-gray-400 flex-shrink-0 ml-2"
      />
    </button>

    <!-- Deploy to WordPress -->
    <button
      class="mt-8 rounded-md border-1 border-[#394147] bg-[#232E36] hover:bg-gray-700 text-gray-100 flex items-center p-4 transition-colors"
      @click="$emit('show-wordpress-deploy')"
      :disabled="deployingToWordpress"
    >
      <Icon icon="ic:round-wordpress" class="text-[32px] mr-4 text-gray-100 flex-shrink-0" />
      <div class="text-left flex-1 min-w-0">
        <div class="text-lg font-light">Deploy to WordPress</div>
        <div class="text-sm font-light text-gray-400">
          <span v-if="deployingToWordpress">Deploying…</span>
          <span v-else>Release your dynamic website</span>
        </div>
      </div>
      <Icon
        icon="material-symbols:chevron-right-rounded"
        class="text-[24px] text-gray-400 flex-shrink-0 ml-2"
      />
    </button>
  </div>
</template>
