<template>
  <button :class="buttonClass">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'transparent' | 'circular';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}>();

const buttonClass = computed(() => {
  const base =
    'inline-flex items-center justify-center font-sans text-white rounded-md text-sm font-light transition-all duration-200 backdrop-blur-md flex-shrink-0';

  const variants = {
    primary:
      'bg-[linear-gradient(180deg,#137D3F_0%,#0E6633_50%,#0A582B_100%)] shadow-[inset_0_1px_0_#ffffff24,inset_0_2px_0_#ffffff14,inset_0_-1px_0_#0000001c,inset_0_-2px_0_#0000000d,0_2px_0_-1px_#00000033,0_1px_0_1px_#0000001c] border-none h-10 px-6 min-w-24',

    secondary:
      'bg-[radial-gradient(96.3%_100%_at_49.38%_100%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.00)_50%),linear-gradient(0deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.05)_100%),rgba(0,0,0,0.20)] shadow-[inset_0_0_8px_rgba(255,255,255,0.11)] border border-[rgba(255,255,255,0.11)] h-10 px-6 min-w-24',

    danger:
      'bg-[radial-gradient(96.3%_100%_at_49.38%_100%,rgba(246,75,109,0.2)_0%,rgba(246,75,109,0)_50%),linear-gradient(0deg,rgba(246,75,109,0.05)_0%,rgba(246,75,109,0.05)_100%),rgba(0,0,0,0.20)] shadow-[inset_0_0_8px_rgba(255,255,255,0.11),inset_0_0_12px_rgba(246,75,109,0.3)] border border-[#D32744] h-10 px-6 min-w-24',

    transparent:
      'bg-black/50 opacity-50 hover:opacity-100 transition-opacity h-8 min-w-8 rounded-[4px] px-0',

    circular: 'rounded-full border border-[#454D56] flex items-center justify-center p-0',
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-base',
    md: 'h-12 w-12 text-xl',
    lg: 'h-16 w-16 text-2xl',
    xl: 'h-24 w-24 text-4xl',
  };

  let currentBase = base;
  let variantClasses = variants[props.variant || 'primary'];
  let currentSizeClasses = '';

  if (props.variant === 'circular') {
    currentSizeClasses = sizeClasses[props.size || 'xl'];
    currentBase = currentBase.replace('rounded-md', '');
  }

  return `${currentBase} ${variantClasses} ${currentSizeClasses}`;
});
</script>
