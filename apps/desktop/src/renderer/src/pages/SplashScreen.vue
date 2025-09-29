<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import bgImage from '@/assets/img/splash_screen_background.png';
import pkg from '../../../../package.json';
import { useRouter } from 'vue-router';
import { backendClient } from '@/utils';

const router = useRouter();
const version = pkg.version;
const backendServerRunning = ref(false);
const backendServerError = ref('');
const backendServerStatus = computed(() => {
  if (backendServerRunning.value) {
    return 'running';
  } else if (backendServerError.value) {
    return `error`;
  } else {
    return 'stopped';
  }
});

const backendServerColor = {
  running: 'text-green-400',
  error: 'text-red-400',
  stopped: 'text-gray-400',
};

function refreshServersStatus(): void {
  globalThis.window.api
    .serverStatus()
    .then((data: { running: boolean; baseUrl: string; error: string }) => {
      backendServerRunning.value = data.running;
      backendServerError.value = data.error;

      if (data.running) {
        backendClient.baseUrl = data.baseUrl;
        globalThis.localStorage.setItem('backendBaseUrl', data.baseUrl);
      }
    })
    .catch((error) => {
      console.error('Failed to get server status:', error);
    });
}

onMounted(() => {
  refreshServersStatus();
});

function startServer(): void {
  globalThis.window.api
    .startServer()
    .then((data: { running: boolean; baseUrl: string; error: string }) => {
      backendServerRunning.value = data.running;
      backendServerError.value = data.error;

      if (data.running) {
        backendClient.baseUrl = data.baseUrl;
        globalThis.localStorage.setItem('backendBaseUrl', data.baseUrl);

        void router.push(`/projects`);
      }
    })
    .catch((error) => {
      console.error('Failed to start servers:', error);
    });
}

// Create an array of dots for the gradient
const dotCount = 20;
const dots = Array.from({ length: dotCount }, (_, i) => {
  const ratio = i / (dotCount - 1);
  const start = { r: 15, g: 21, b: 25 }; // gray-950
  const end = { r: 34, g: 197, b: 94 }; // green-500
  const r = Math.round(start.r + (end.r - start.r) * ratio);
  const g = Math.round(start.g + (end.g - start.g) * ratio);
  const b = Math.round(start.b + (end.b - start.b) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
});
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-between text-white font-sans relative bg-cover bg-center"
    :style="{ backgroundImage: `url(${bgImage})` }"
  >
    <div
      class="flex-1 flex flex-col items-center justify-center gap-[50px] text-center relative pt-30"
    >
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-[400px] h-[400px] rounded-full bg-green-500 opacity-10 blur-3xl" />
      </div>

      <h1 class="text-white font-sans text-[64px] font-thin leading-[46px] tracking-[-2px] mb-6">
        All set. Welcome aboard!
      </h1>
      <button
        class="flex w-[192px] h-[48px] min-w-[40px] px-[24px] justify-center items-center flex-shrink-0 rounded-md btn-primary cursor-pointer"
        @click="startServer"
      >
        Get started
      </button>
    </div>

    <div
      class="self-center -mt-6 bg-[#0F1519] rounded-2xl p-8 flex flex-col gap-6 w-[384px] border border-[#505A64]"
    >
      <div class="flex items-center">
        <span class="text-sm font-light text-gray-200">Server status</span>
        <div class="flex-grow flex justify-between items-center mx-4">
          <div
            v-for="(color, index) in dots"
            :key="'srv-dot-' + index"
            class="w-[2px] h-[2px] rounded-full"
            :style="{ backgroundColor: color }"
          />
        </div>
        <span class="text-sm font-light" :class="backendServerColor[backendServerStatus]">
          {{ backendServerStatus }}
          {{ (backendServerError ?? '') !== '' ? `- ${backendServerError}` : '' }}
        </span>
      </div>
    </div>

    <div class="px-6 py-4 flex items-start text-sm text-gray-400">
      <div class="flex flex-col gap-4">
        <div>
          <p class="mb-1">Repository:</p>
          <a
            href="https://github.com/wsolut/websolut"
            target="_blank"
            class="text-white hover:text-gray-400 font-extralight"
          >
            https://github.com/wsolut/websolut
          </a>
        </div>

        <div>
          <p class="mb-1">Homepage:</p>
          <a
            href="https://websolut.tech"
            target="_blank"
            class="text-white hover:text-gray-400 font-extralight"
          >
            websolut.tech
          </a>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 right-6 text-xs text-[#656F79]">ver. {{ version }}</div>
  </div>
</template>

<style>
body {
  background-color: black;
}

.btn-primary {
  border-radius: 6px;
  background: linear-gradient(180deg, #137d3f 0%, #0e6633 50%, #0a582b 100%);
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 0.14) inset,
    0 2px 0 0 rgba(255, 255, 255, 0.08) inset,
    0 -1px 0 0 rgba(0, 0, 0, 0.11) inset,
    0 -2px 0 0 rgba(0, 0, 0, 0.05) inset,
    0 2px 0 -1px rgba(0, 0, 0, 0.2),
    0 1px 0 1px rgba(0, 0, 0, 0.11);
}
</style>
