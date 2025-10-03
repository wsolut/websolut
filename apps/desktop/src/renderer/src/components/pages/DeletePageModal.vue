<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';

const emit = defineEmits(['confirm', 'cancel']);
const inputText = ref('');

const inputRef = ref<InstanceType<typeof Input> | null>(null);

const isValidDelete = computed(() => inputText.value.trim() === 'delete');

const confirmDelete = () => {
  if (isValidDelete.value) {
    emit('confirm');
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('cancel');
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);
  await nextTick();
  inputRef.value?.focus();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
    <div class="bg-[#151D23] border border-[#29343D] p-8 rounded-lg w-full max-w-md text-center">
      <h2 class="text-xl mb-2 text-white">Delete page</h2>
      <p class="mb-4 text-[#A7B0BA]">Type "delete" and push the button</p>

      <div class="flex justify-center">
        <Input
          ref="inputRef"
          v-model="inputText"
          input-type="text"
          :custom-class="'w-3/4 mx-auto text-center'"
          :label="''"
        />
      </div>
      <div class="flex gap-5 justify-center mt-8">
        <Button variant="secondary" size="lg" @click="$emit('cancel')"> NO, keep it </Button>
        <Button
          variant="danger"
          size="lg"
          :disabled="!isValidDelete"
          :class="isValidDelete ? 'cursor-pointer' : 'cursor-not-allowed'"
          @click="confirmDelete"
        >
          YES, delete it
        </Button>
      </div>
    </div>
  </div>
</template>
