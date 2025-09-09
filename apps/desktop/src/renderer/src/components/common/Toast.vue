<template>
  <Teleport to="#toast-root">
    <div
      class="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 transform space-y-2 pointer-events-none"
    >
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'relative mx-auto w-full max-w-md rounded-xl px-6 py-4 pr-12 text-white shadow md:max-w-lg',
            toastBg(toast.type),
          ]"
        >
          <div class="px-5 py-1">
            <Icon
              v-if="types[toast.type]?.icon"
              :icon="types[toast.type].icon"
              class="absolute left-1 top-1/2 mx-5 h-10 w-10 -translate-y-1/2 text-black opacity-50"
            />
            <div class="ml-10">
              <div>{{ toast.message }}</div>
            </div>
          </div>

          <button
            @click="remove(toast.id)"
            class="absolute right-2 top-2 text-lg leading-none text-white hover:text-gray-200"
          >
            <Icon icon="material-symbols:cancel" class="h-6 w-6 opacity-50" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '../../stores/toastStore';
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();
const toastStore = useToastStore();
const toasts = toastStore.toasts;
const remove = toastStore.removeToast;

const types = {
  error: {
    icon: 'material-symbols:cancel',
    message: computed(() => t('toast.errorMessage')),
  },
  success: {
    icon: 'material-symbols:check-circle',
    message: computed(() => t('toast.successMessage')),
  },
  info: {
    icon: 'material-symbols:info',
    message: computed(() => t('toast.infoMessage')),
  },
};

const toastBg = (type) => {
  switch (type) {
    case 'success':
      return 'bg-[#00610E]';
    case 'error':
      return 'bg-[#920022]';
    case 'info':
      return 'bg-blue-500';
    default:
      return 'bg-gray-700';
  }
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
