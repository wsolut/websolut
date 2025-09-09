<template>
  <Hint v-if="fieldErrors.length > 0" :variant="'danger'">
    {{ fieldErrors.join(', ') }}
  </Hint>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Hint from '@/components/common/Hint.vue';

const props = defineProps<{
  errors?: string[];
}>();

const fieldErrors = computed(() => {
  return props.errors || [];
});
</script>
