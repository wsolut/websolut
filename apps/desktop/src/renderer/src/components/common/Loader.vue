<script setup lang="ts">
import { VueSpinnerRings } from 'vue3-spinners';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

const props = defineProps({
  size: {
    type: String as () => Size,
    default: 'md' as Size,
    validator: (value: unknown): value is Size =>
      typeof value === 'string' &&
      ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'].includes(value),
  },
});

const sizeMap: Record<Size, string> = {
  xs: '32px',
  sm: '48px',
  md: '64px',
  lg: '80px',
  xl: '96px',
  '2xl': '128px',
  '3xl': '160px',
  '4xl': '192px',
  '5xl': '256px',
};
</script>

<template>
  <VueSpinnerRings :size="sizeMap[props.size]" color="#2DE97B" />
</template>
