<template>
  <button
    @click="$emit('click')"
    class="inline-flex items-center justify-center bg-black opacity-70 rounded-full border border-white text-white hover:bg-gray-800 transition-colors duration-150"
    :class="sizeClass"
    type="button"
  >
    <Icon icon="material-symbols:close-rounded" :class="iconSizeClass" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

type Size = 'sm' | 'md' | 'lg';

const props = defineProps({
  size: {
    type: String as () => Size,
    default: 'md' as Size,
    validator: (value: unknown): value is Size =>
      typeof value === 'string' && ['sm', 'md', 'lg'].includes(value),
  },
});

defineEmits(['click']);

const sizeClass = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  return sizes[props.size];
});

const iconSizeClass = computed(() => {
  const iconSizes: Record<Size, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  return iconSizes[props.size];
});
</script>

<style scoped>
button:hover {
  transform: scale(1.05);
}

button:active {
  transform: scale(0.95);
}
</style>
