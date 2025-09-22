<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'radix-vue';
import { Icon } from '@iconify/vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import TextArea from '@/components/common/TextArea.vue';
import CloseButton from '@/components/common/CloseButton.vue';
import ErrorsHint from '@/components/common/ErrorsHint.vue';
import { MAX_TAG_LENGTH, MAX_TAGS, SHORT_TAG_THRESHOLD, LONG_TAG_CAP } from '@/constants/tags';
import DrawerConfirmationModal from '../modals/DrawerConfirmationModal.vue';
import { backendClient } from '@/utils/index';
import { RequestStatus } from '@/entities';
import { ProjectInputDto } from '@/@types';
import { useDirtyState } from '@/composables';

const projectCreateRequest = reactive(new RequestStatus());
const emit = defineEmits(['close', 'created']);
const showUnsavedModal = ref(false);

// Form state
const blankProject: ProjectInputDto = reactive({
  name: '',
  description: '',
  tags: [] as string[],
  outDirPath: '',
  templatesDirPath: '',
  assetsOutDir: '',
  assetsPrefixPath: '',
});

const project = reactive<ProjectInputDto>({ ...blankProject });
const { isDirty, rollback } = useDirtyState(blankProject);
const accordionItems = [
  {
    value: 'item-1',
    title: 'Advanced options',
  },
];
const folderPickerAvailable = !!(window.api && window.api.pickFolder);

async function handleOutDirPathClick() {
  if (folderPickerAvailable) {
    const folder = await window.api.pickFolder();

    if (folder) {
      project.outDirPath = folder;
    }
  }
}

async function handleTemplatesDirPathClick() {
  if (folderPickerAvailable) {
    const folder = await window.api.pickFolder();

    if (folder) {
      project.templatesDirPath = folder;
    }
  }
}

async function handleAssetsOutDirClick() {
  console.log('Picking folder for assetsOutDir');
  if (folderPickerAvailable) {
    const folder = await window.api.pickFolder();

    if (folder) {
      project.assetsOutDir = folder;
    }
  }
}

function clearProject() {
  rollback(project);
  projectCreateRequest.status = 'idle';
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeModal();
};

const closeModal = () => {
  if (isDirty(project)) {
    showUnsavedModal.value = true;
  } else {
    confirmClose();
  }
};

const confirmClose = () => {
  clearProject();
  showUnsavedModal.value = false;
  emit('close');
};

const cancelClose = () => {
  showUnsavedModal.value = false;
};

const createProject = () => {
  projectCreateRequest.status = 'pending';
  backendClient
    .projectsCreate({
      name: project.name,
      description: project.description,
      tags: project.tags,
      outDirPath: project.outDirPath,
      templatesDirPath: project.templatesDirPath,
      assetsOutDir: project.assetsOutDir,
      assetsPrefixPath: project.assetsPrefixPath,
    })
    .then((response) => {
      projectCreateRequest.status = 'success';
      if (response.data) emit('created', response.data);
      confirmClose();
    })
    .catch((e) => projectCreateRequest.parseError(e));
};

const handleTagInput = (event: KeyboardEvent) => {
  const inputElement = event.target as HTMLInputElement;
  const trimmedValue = inputElement.value.trim();

  if (event.key === ',' || event.key === 'Enter') {
    if (trimmedValue !== '') {
      projectCreateRequest.errors.tags = [];

      // Length check
      if (trimmedValue.length > MAX_TAG_LENGTH) {
        event.preventDefault();
        projectCreateRequest.errors.tags = [
          `Tags can’t be longer than ${MAX_TAG_LENGTH} characters.`,
        ];
        return;
      }

      // Count existing tags
      const longTags = project.tags?.filter((tag) => tag.length > SHORT_TAG_THRESHOLD);

      if (project.tags && project.tags.length >= MAX_TAGS) {
        event.preventDefault();
        projectCreateRequest.errors.tags = [`You can add up to ${MAX_TAGS} tags in total.`];
        return;
      }

      if (
        longTags &&
        longTags.length >= LONG_TAG_CAP &&
        trimmedValue.length > SHORT_TAG_THRESHOLD
      ) {
        event.preventDefault();
        projectCreateRequest.errors.tags = [
          `You can only add up to ${LONG_TAG_CAP} long tags (over ${SHORT_TAG_THRESHOLD} characters).`,
        ];
        return;
      }

      // Duplicate check
      if (project.tags && project.tags.includes(trimmedValue)) {
        event.preventDefault();
        projectCreateRequest.errors.tags = [`This tag has already been added.`];
        return;
      }
    }
  }
};

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<template>
  <DialogRoot :open="true">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50 backdrop-blur-md z-50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] outline-none flex flex-col max-h-[90vh] w-[480px]"
        @pointer-down-outside="closeModal"
      >
        <form
          novalidate
          @submit.prevent="createProject"
          class="flex flex-col items-start p-12 gap-12 rounded-lg bg-[#151D23] text-white flex-1 min-h-0 overflow-y-auto"
          style="max-height: 100%"
        >
          <header class="w-full flex flex-col">
            <div class="w-full flex justify-end mb-2">
              <DialogClose as-child>
                <CloseButton @click="closeModal" />
              </DialogClose>
            </div>
            <DialogTitle class="text-xl font-light text-center">New Project</DialogTitle>
          </header>

          <DialogDescription class="sr-only"> Create a new project </DialogDescription>

          <div class="w-full space-y-6">
            <!-- Name Field -->
            <div class="flex items-start gap-4">
              <label class="text-sm font-light w-20">Name<span class="text-red-500">*</span></label>
              <div class="flex-1">
                <Input
                  v-model="project.name"
                  class="w-full text-sm placeholder:text-gray-500 break-words whitespace-pre-wrap"
                  variant="gray"
                  placeholder="e.g. customer's name"
                  :errors="projectCreateRequest.errors.name"
                />
              </div>
            </div>

            <!-- Description Field -->
            <div class="flex items-start gap-4">
              <label class="text-sm font-light w-20">Description</label>
              <div class="flex-1">
                <TextArea
                  v-model="project.description"
                  variant="gray"
                  class="w-full text-sm placeholder:text-gray-500 break-words whitespace-pre-wrap max-h-40"
                  placeholder="e.g. Think about form and shape..."
                  input-type="textarea"
                  :resizeable="false"
                  :errors="projectCreateRequest.errors.description"
                />
              </div>
            </div>

            <!-- Tags Field -->
            <div>
              <label class="block text-sm font-light mb-0.5">
                Tags
                <span class="font-light text-sm opacity-40 ml-0.5">(optional)</span>
              </label>
              <TagsInputRoot
                v-model="project.tags"
                class="flex flex-wrap gap-2 items-start border border-[#252a35] rounded-lg p-2 w-full bg-[#0F1519] max-h-24 overflow-y-auto"
              >
                <TagsInputItem
                  v-for="(tag, index) in project.tags || []"
                  :key="index"
                  :value="tag"
                  class="flex items-start gap-2 bg-[#137D3F] rounded px-2 py-1 text-xs max-w-full break-words whitespace-normal overflow-hidden"
                >
                  <TagsInputItemText class="break-words whitespace-normal" />
                  <TagsInputItemDelete
                    class="rounded-full hover:bg-[#0d5a2d] transition-colors shrink-0"
                  >
                    <Icon icon="lucide:x" class="w-3 h-3" />
                  </TagsInputItemDelete>
                </TagsInputItem>
                <TagsInputInput
                  placeholder="e.g. comma separated tags"
                  class="flex-1 min-w-[60px] bg-transparent text-sm px-1 py-1 focus:outline-none placeholder:text-gray-500"
                  @keydown="handleTagInput"
                />
              </TagsInputRoot>
              <ErrorsHint :errors="projectCreateRequest.errors.tags" />
            </div>

            <AccordionRoot class="w-100" type="single" :collapsible="true">
              <template v-for="item in accordionItems" :key="item.value">
                <AccordionItem class="mt-px overflow-hidden first:mt-0" :value="item.value">
                  <AccordionHeader class="flex">
                    <AccordionTrigger
                      class="flex h-[45px] flex-1 cursor-default items-center justify-betwee py-5 text-[15px] leading-none shadow-[0_1px_0] outline-none group"
                    >
                      <span>{{ item.title }}</span>
                      <Icon
                        icon="radix-icons:chevron-down"
                        class="ms-2 ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180"
                        aria-label="Expand/Collapse"
                      />
                    </AccordionTrigger>
                  </AccordionHeader>
                  <AccordionContent
                    class="space-y-6 flex-1 p-4 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden"
                  >
                    <div class="flex items-center gap-4">
                      <label class="text-sm font-extralight w-24">Output Directory</label>
                      <Input
                        v-model="project.outDirPath"
                        placeholder="e.g. /path/to/output"
                        :errors="projectCreateRequest.errors.outDirPath"
                        class="flex-1 text-sm placeholder:text-gray-500"
                        @action-button-click="handleOutDirPathClick"
                        :action-button-icon="folderPickerAvailable ? 'material-symbols:folder' : ''"
                      />
                    </div>

                    <div class="flex items-center gap-4">
                      <label class="text-sm font-extralight w-24">Templates Directory</label>
                      <Input
                        v-model="project.templatesDirPath"
                        placeholder="e.g. /path/to/templates"
                        :errors="projectCreateRequest.errors.templatesDirPath"
                        class="flex-1 text-sm placeholder:text-gray-500"
                        @action-button-click="handleTemplatesDirPathClick"
                        :action-button-icon="folderPickerAvailable ? 'material-symbols:folder' : ''"
                      />
                    </div>

                    <div class="flex items-center gap-4">
                      <label class="text-sm font-extralight w-24">Assets Output Directory</label>
                      <Input
                        v-model="project.assetsOutDir"
                        placeholder="e.g. /path/to/assets"
                        :errors="projectCreateRequest.errors.assetsOutDir"
                        class="flex-1 text-sm placeholder:text-gray-500"
                        @action-button-click="handleAssetsOutDirClick"
                        :action-button-icon="folderPickerAvailable ? 'material-symbols:folder' : ''"
                      />
                    </div>

                    <div class="flex items-center gap-4">
                      <label class="text-sm font-extralight w-24">Assets Prefix Path</label>
                      <Input
                        v-model="project.assetsPrefixPath"
                        placeholder="e.g. /assets"
                        :errors="projectCreateRequest.errors.assetsPrefixPath"
                        class="flex-1 text-sm placeholder:text-gray-500"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </template>
            </AccordionRoot>
          </div>

          <footer v-if="!projectCreateRequest.pending" class="w-full flex justify-end gap-3">
            <DialogClose as-child>
              <Button type="button" variant="secondary" @click="closeModal">Abort</Button>
            </DialogClose>
            <Button
              type="submit"
              variant="primary"
              :is-processing="projectCreateRequest.pending"
              :disabled="projectCreateRequest.pending"
            >
              {{ projectCreateRequest.pending ? 'Creating...' : 'Create' }}
            </Button>
          </footer>
        </form>
        <div v-if="showUnsavedModal" class="fixed inset-0 z-[200] flex items-center justify-center">
          <DrawerConfirmationModal
            :show="showUnsavedModal"
            @confirm="confirmClose"
            @cancel="cancelClose"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
