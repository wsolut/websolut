<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import CloseButton from '@/components/common/CloseButton.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '400px',
  },
  title: {
    type: String,
    default: 'Preview',
  },
});

const emit = defineEmits(['close']);

const drawerRef = ref(null);
const overlayRef = ref(null);

const closeDrawer = () => {
  emit('close');
};

const handleOverlayClick = (event: Event) => {
  if (event.target === overlayRef.value) {
    closeDrawer();
  }
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    closeDrawer();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
});

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-overlay">
      <div v-if="isOpen" ref="overlayRef" class="drawer-overlay" @click="handleOverlayClick">
        <Transition name="drawer-slide">
          <div
            v-if="isOpen"
            ref="drawerRef"
            class="drawer-container rounded-lg bg-[#151D23] text-white"
            :style="{ width: width }"
          >
            <!-- Header -->
            <div class="flex flex-col">
              <!-- Close button at top-right -->
              <div class="flex justify-end mb-2 pr-4 pt-4">
                <CloseButton @click="closeDrawer" size="sm" />
              </div>

              <!-- Centered header slot -->
              <div class="flex justify-center w-full">
                <slot name="header" />
              </div>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto p-6">
              <slot> ... </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

.drawer-container {
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  height: 100vh;
  overflow: hidden;
}

.drawer-overlay-enter-active,
.drawer-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-overlay-enter-from,
.drawer-overlay-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .drawer-container {
    max-width: 100vw;
    width: 100vw !important;
  }
}
</style>
