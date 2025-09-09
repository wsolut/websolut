<template>
  <div :class="hintClass" role="alert" aria-live="polite">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger';
}>();

const hintClass = computed(() => {
  const base = 'text-xs mt-1 px-1.5';

  const variants = {
    primary: 'text-primary',
    secondary: 'text-gray-400',
    danger: 'text-red-500',
  };

  let currentBase = base;
  let variantClasses = variants[props.variant || 'primary'];

  return `${currentBase} ${variantClasses}`;
});
</script>
