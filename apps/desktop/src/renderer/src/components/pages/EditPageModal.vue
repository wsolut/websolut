<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  SwitchRoot,
  SwitchThumb,
} from 'radix-vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import CloseButton from '@/components/common/CloseButton.vue';
import ErrorsHint from '@/components/common/ErrorsHint.vue';
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { backendClient } from '@/utils';
import { Page } from '@/@types';
import { RequestStatus } from '@/entities';

const props = defineProps<{
  page: Page;
}>();

const emit = defineEmits(['close', 'updated']);

const page = ref<Page>({ ...props.page });
const pageUpdateRequest = reactive(new RequestStatus());

function closeModal() {
  pageUpdateRequest.status = 'idle';
  page.value = { ...props.page };
  emit('close');
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeModal();
};

function updatePage() {
  pageUpdateRequest.status = 'pending';

  backendClient
    .pagesUpdate(Number(page.value.id), {
      path: page.value.path,
      figmaToken: page.value.figmaToken,
      figmaUrl: page.value.figmaUrl,
      homePage: page.value.homePage,
      projectId: page.value.projectId,
    })
    .then((response) => {
      pageUpdateRequest.status = 'success';

      if (response.data) {
        emit('updated', response.data);
      }

      closeModal();
    })
    .catch((error) => pageUpdateRequest.parseError(error));
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <DialogRoot :open="true">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-md z-50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] outline-none"
        @pointer-down-outside="closeModal"
      >
        <form
          novalidate
          @submit.prevent="updatePage"
          class="flex flex-col p-12 gap-8 rounded-lg bg-[#151D23] text-white w-[440px]"
        >
          <!-- Header – title centered, close button on the right -->
          <div class="flex items-center justify-between w-full">
            <!-- Empty element keeps the title truly centered -->
            <div class="w-6"></div>

            <DialogTitle class="text-xl font-light text-center"> Edit Page </DialogTitle>

            <DialogClose as-child>
              <CloseButton @click="closeModal" />
            </DialogClose>
          </div>

          <DialogDescription class="sr-only"> Update the page route </DialogDescription>

          <div class="space-y-6 flex-1">
            <div class="flex items-center gap-4">
              <label class="text-sm font-extralight w-24">
                Figma Token<span class="text-red-500">*</span>
              </label>
              <Input
                v-model="page.figmaToken"
                placeholder="e.g. figd_123..."
                :errors="pageUpdateRequest.errors.figmaToken"
                class="flex-1 text-sm placeholder:text-gray-500"
              />
            </div>

            <div class="flex items-center gap-4">
              <label class="text-sm font-extralight w-24">Route</label>
              <Input
                v-model="page.path"
                placeholder="e.g. /about-us (or leave it blank)"
                :errors="pageUpdateRequest.errors.path"
                hint="System will populate it, if blank"
                class="flex-1 text-sm placeholder:text-gray-500"
              />
            </div>

            <div class="flex items-center gap-4">
              <label class="text-sm font-extralight w-24">Home Page</label>
              <SwitchRoot
                v-model:checked="page.homePage"
                class="w-[50px] h-[30px] focus:outline-none bg-gray-600 rounded-full relative data-[state=checked]:bg-green-600 transition-colors"
              >
                <SwitchThumb
                  class="block w-[26px] h-[26px] bg-gray-200 rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]"
                />
              </SwitchRoot>
              <ErrorsHint :errors="pageUpdateRequest.errors.homePage" />
            </div>
          </div>

          <!-- Footer actions -->
          <footer class="flex justify-end gap-3 pt-4">
            <DialogClose as-child>
              <Button type="button" @click="closeModal" variant="secondary"> Cancel </Button>
            </DialogClose>
            <Button type="submit" :disabled="pageUpdateRequest.pending" variant="primary">
              {{ pageUpdateRequest.pending ? 'Updating...' : 'Update' }}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
