<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { backendClient } from '@/utils';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import CloseButton from '@/components/common/CloseButton.vue';
import ErrorsHint from '@/components/common/ErrorsHint.vue';
import { RequestStatus } from '@/entities';
import { SwitchRoot, SwitchThumb } from 'radix-vue';
import DrawerConfirmationModal from '@/components/modals/DrawerConfirmationModal.vue';
import { PageInputDto, Project } from '@/@types';
import { useDirtyState } from '@/composables';

const props = defineProps<{
  project: Project;
  numOfPages: number;
}>();
const pageCreateRequest = reactive(new RequestStatus());
const showUnsavedModal = ref(false);
const emit = defineEmits(['close', 'created']);

// Form state
const blankPage = computed<PageInputDto>(() => ({
  figmaToken: props.project.figmaToken || '',
  projectId: props.project.id,
  homePage: !(props.numOfPages > 0),
  figmaUrl: '',
  path: '',
}));

const page = reactive<PageInputDto>({ ...blankPage.value });
const { isDirty, rollback } = useDirtyState(blankPage.value);

function clearPage() {
  rollback(page);
  pageCreateRequest.status = 'idle';
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeModal();
};

const closeModal = () => {
  if (isDirty(page)) {
    showUnsavedModal.value = true;
  } else {
    confirmClose();
  }
};

const confirmClose = () => {
  clearPage();
  showUnsavedModal.value = false;
  emit('close');
};

const cancelClose = () => {
  showUnsavedModal.value = false;
};

const createPage = () => {
  pageCreateRequest.status = 'pending';
  backendClient
    .pagesCreate(page)
    .then((res) => {
      pageCreateRequest.status = 'success';
      if (res.data) {
        emit('created', res.data);
        void backendClient.pagesSynchronize(res.data.id);
      }
      confirmClose();
    })
    .catch((error) => pageCreateRequest.parseError(error));
};

const figmaUrlInputRef = ref<InstanceType<typeof Input> | null>(null);

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);
  await nextTick();
  figmaUrlInputRef.value?.focus();
});
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-end">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-md" @click="closeModal" />

    <div
      class="relative w-full max-w-[600px] min-w-[450px] h-full bg-[#151D23] overflow-y-auto shadow-xl"
    >
      <form novalidate @submit.prevent="createPage" class="flex flex-col h-full p-8 text-white">
        <div class="flex justify-end">
          <CloseButton @click="closeModal" class="mb-4" />
        </div>

        <header class="text-center mb-14">
          <h1 class="text-lg font-extralight">Add Page</h1>
        </header>

        <div class="space-y-6 flex-1 max-w-[500px] mx-auto">
          <div class="flex items-center gap-4">
            <label class="text-sm font-extralight w-24">
              Figma URL<span class="text-red-500">*</span>
            </label>
            <Input
              ref="figmaUrlInputRef"
              v-model="page.figmaUrl"
              placeholder="https://www.figma.com/file/..."
              :errors="pageCreateRequest.errors.figmaUrl"
              class="flex-1 text-sm placeholder:text-gray-500"
            />
          </div>

          <div class="flex items-center gap-4">
            <label class="text-sm font-extralight w-24">
              Figma Token<span class="text-red-500">*</span>
            </label>
            <Input
              v-model="page.figmaToken"
              placeholder="e.g. figd_123..."
              :errors="pageCreateRequest.errors.figmaToken"
              class="flex-1 text-sm placeholder:text-gray-500"
            />
          </div>

          <div class="flex items-center gap-4">
            <label class="text-sm font-extralight w-24">Route</label>
            <Input
              v-model="page.path"
              placeholder="e.g. /about-us (or leave it blank)"
              :errors="pageCreateRequest.errors.path"
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
            <ErrorsHint :errors="pageCreateRequest.errors.homePage" />
          </div>
        </div>

        <footer class="flex justify-end gap-3 pt-6 mt-8">
          <Button type="button" variant="secondary" @click="closeModal">Abort</Button>
          <Button type="submit" variant="primary" :disabled="pageCreateRequest.pending">
            {{ pageCreateRequest.pending ? 'Adding...' : 'Add' }}
          </Button>
        </footer>
      </form>
    </div>

    <DrawerConfirmationModal
      v-if="showUnsavedModal"
      @confirm="confirmClose"
      @cancel="cancelClose"
    />
  </div>
</template>
