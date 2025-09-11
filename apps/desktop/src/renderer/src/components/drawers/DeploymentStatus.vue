<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/components/common/Button.vue';
import { Project } from '@/@types';

const props = defineProps<{
  project: Project;
  deploying: boolean;
  deploySuccessful: boolean;
  errorTitle: string;
  errorDescription: string;
}>();

const emit = defineEmits(['dismiss', 'visit']);

// Animation for pending dots
const dotCount = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (props.deploying) {
    intervalId = setInterval(() => {
      dotCount.value = (dotCount.value + 1) % 4;
    }, 500);
  }
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});

const dots = computed(() => {
  return '.'.repeat(dotCount.value);
});
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full py-12 mt-5">
    <!-- pending State -->
    <div v-if="deploying" class="flex flex-col items-center">
      <svg
        width="96"
        height="97"
        viewBox="0 0 96 97"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M53.8888 71.26C53.3889 71.26 52.869 71.14 52.3891 70.86C50.9494 70.04 50.4695 68.2 51.2893 66.76L73.3647 28.52C74.4245 26.7 74.9644 24.62 74.9644 22.52C74.9644 15.9 69.5855 10.52 62.9669 10.52H32.9731C27.0943 10.52 21.9954 14.9 21.1156 20.72C21.0356 21.32 20.9756 21.92 20.9756 22.52C20.9756 22.72 20.9756 22.92 20.9756 23.12C21.0556 24.78 19.7759 26.18 18.1362 26.26C16.4765 26.34 15.0768 25.06 14.9969 23.42C14.9969 23.12 14.9769 22.82 14.9769 22.52C14.9769 21.62 15.0368 20.7 15.1768 19.82C16.4965 11.1 24.135 4.52002 32.9731 4.52002H62.9669C72.8848 4.52002 80.9631 12.6 80.9631 22.52C80.9631 25.68 80.1233 28.8 78.5436 31.52L56.4682 69.76C55.9083 70.72 54.9085 71.26 53.8688 71.26H53.8888Z"
          fill="white"
        />
        <path
          d="M62.9869 92.48C56.5882 92.48 50.6095 89.04 47.4101 83.48L30.4137 54.02C29.5938 52.58 30.0737 50.76 31.5134 49.92C32.9531 49.08 34.7928 49.58 35.6126 51.02L52.609 80.48C54.7486 84.18 58.7278 86.48 63.0069 86.48C67.286 86.48 71.2651 84.18 73.4047 80.48L88.4016 54.5C89.4614 52.68 90.0012 50.6 90.0012 48.5C90.0012 43.98 87.5018 39.88 83.4826 37.82C82.0029 37.06 81.423 35.26 82.1829 33.78C82.9427 32.3 84.7423 31.72 86.222 32.48C92.2608 35.58 96 41.72 96 48.5C96 51.66 95.1602 54.78 93.5805 57.5L78.5836 83.48C75.3643 89.04 69.4055 92.48 62.9869 92.48Z"
          fill="white"
        />
        <path
          d="M32.9931 92.48C26.5945 92.48 20.6157 89.04 17.4164 83.48L2.3995 57.5C0.819829 54.78 0 51.66 0 48.5C0 38.58 8.07832 30.5 17.9963 30.5C22.7953 30.5 27.3143 32.38 30.7136 35.78L32.9931 38.06L35.2727 35.78C38.6719 32.38 43.191 30.5 47.99 30.5C52.789 30.5 57.3081 32.38 60.7074 35.78L61.3472 36.42C62.527 37.6 62.527 39.5 61.3472 40.66C60.1675 41.84 58.2679 41.84 57.1081 40.66L56.4682 40.02C54.2087 37.76 51.1893 36.5 47.99 36.5C44.7907 36.5 41.7713 37.74 39.5118 40.02L35.1127 44.42C33.9329 45.6 32.0333 45.6 30.8736 44.42L26.4745 40.02C24.215 37.76 21.1956 36.5 17.9963 36.5C11.3776 36.5 5.99875 41.88 5.99875 48.5C5.99875 50.62 6.55863 52.68 7.59842 54.5L22.5953 80.48C24.7348 84.18 28.714 86.48 32.9931 86.48C35.3126 86.48 37.5722 85.82 39.4918 84.56C40.8915 83.66 42.7311 84.06 43.6309 85.44C44.5307 86.82 44.1308 88.68 42.7511 89.58C39.8317 91.46 36.4724 92.48 32.9931 92.48Z"
          fill="white"
        />
      </svg>
      <p class="text-xl font-extralight mt-12">Deploying{{ dots }}</p>
    </div>

    <!-- Success State -->
    <div v-else-if="deploySuccessful" class="flex flex-col items-center">
      <Icon icon="material-symbols:check-circle-outline-rounded" class="text-8xl text-green-500" />
      <p class="text-xl font-extralight mt-6">Deploy successful</p>
      <div class="mt-8">
        <Button @click="emit('visit')" variant="secondary" class="px-4 py-2 mt-2"
          >Visit your website</Button
        >
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="!deploySuccessful" class="flex flex-col items-center text-center px-4">
      <Icon icon="material-symbols:error-outline-rounded" class="text-8xl text-red-500" />
      <p class="text-xl font-extralight mt-6 break-words max-w-full sm:max-w-md">
        Deploy failed
      </p>
      <p
        class="text-gray-400 mt-2 break-words max-w-full sm:max-w-md text-center"
      >
        {{ errorTitle }}
      </p>
      <p
        class="text-gray-400 mt-1 break-words max-w-full sm:max-w-md text-center"
      >
        {{ errorDescription }}
      </p>
      <div class="mt-8">
        <Button @click="emit('dismiss')" variant="secondary" class="px-4 py-2 mt-2">
          Setup again
        </Button>
      </div>
    </div>
  </div>
</template>
