<script setup lang="ts">
import { defineEmits } from 'vue';
import Button from '@/components/common/Button.vue';

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
    <div class="bg-[#151D23] border border-[#29343D] p-8 rounded-lg w-full max-w-md text-center">
      <h2 class="text-xl mb-2 text-white">Unsaved changes</h2>
      <p class="mb-4 text-[#A7B0BA]">
        Any unsaved changes will be lost if you close the form. Continue?
      </p>

      <div class="flex gap-5 justify-center mt-8">
        <Button variant="secondary" size="lg" @click="emit('cancel')">No, keep it</Button>
        <Button variant="danger" size="lg" @click="emit('confirm')">Yes, close it</Button>
      </div>
    </div>
  </div>
</template>
