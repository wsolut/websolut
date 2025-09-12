<template>
  <div class="flex flex-col">
    <label v-if="label" :for="inputId" :class="props.labelClass">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1" aria-label="required">*</span>
    </label>

    <div
      class="relative flex items-center h-10 rounded-md transition-colors duration-150 border-1 cursor-pointer bg-[#0F1519]"
      :class="[
        isFocused ? focusedBorderClass : `${borderClass} shadow-[inset_0_0_0_2px_rgba(0,0,0,0.65)]`,
      ]"
      @click="toggleDropdown"
    >
      <input
        :id="inputId"
        ref="inputRef"
        type="text"
        class="bg-transparent w-full focus:outline-none cursor-pointer px-4 text-neutral-200"
        :class="disabled ? 'text-[#505A64]' : ''"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
        :required="required"
        readonly
        :value="displayValue"
        :aria-invalid="!!errorMessage"
        :aria-describedby="ariaDescribedBy"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <div class="absolute right-3 flex items-center h-full" @click.stop="toggleDropdown">
        <Icon
          icon="material-symbols:keyboard-arrow-down-rounded"
          class="text-neutral-400 transition-transform duration-200"
          :class="[dropdownOpen ? 'rotate-180' : 'rotate-0']"
          aria-hidden="true"
        />
      </div>

      <ul
        v-if="dropdownOpen"
        class="absolute z-50 w-full bg-[#202C33] border border-gray-700 rounded-md mt-1 top-full max-h-60 overflow-auto shadow-lg"
        role="listbox"
      >
        <li
          v-for="(option, index) in options"
          :id="`${inputId}-option-${index}`"
          :key="index"
          class="px-4 py-2 cursor-pointer hover:bg-[#2A3B46] text-neutral-200"
          :class="{
            'bg-[#2A3B46] font-medium': isOptionSelected(option),
          }"
          role="option"
          :aria-selected="isOptionSelected(option)"
          @click="selectOption(option)"
          @mouseenter="activeOptionIndex = index"
        >
          {{ getOptionLabel(option) }}
        </li>
      </ul>
    </div>

    <div
      v-if="helperText && !errorMessage"
      :id="inputId + '-helper'"
      class="text-xs text-neutral-400 mt-1 px-1.5"
    >
      {{ helperText }}
    </div>

    <div
      v-if="errorMessage"
      :id="inputId + '-error'"
      class="text-xs text-alert mt-1 px-1.5"
      role="alert"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { Icon } from '@iconify/vue';

type OptionObject = { label: string; value: string };
type Option = string | OptionObject;

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    label?: string;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    errorMessage?: string;
    modelValue?: string | null;
    options?: Option[];
    labelClass?: string;
  }>(),
  {
    placeholder: '',
    label: '',
    helperText: '',
    disabled: false,
    required: false,
    errorMessage: '',
    modelValue: null,
    options: () => [],
    labelClass: '',
  },
);

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'change']);

// Refs and state
const inputId = ref(`dropdown-${Math.random().toString(36).slice(2, 9)}`);
const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);
const dropdownOpen = ref(false);
const activeOptionIndex = ref(-1);

// Computed properties
const borderClass = computed(() =>
  props.errorMessage ? 'border-alert' : props.disabled ? 'border-[#232E36]' : 'border-gray-700',
);

const focusedBorderClass = computed(() => (props.errorMessage ? 'border-alert' : 'border-white'));

const ariaDescribedBy = computed(() => {
  if (props.errorMessage) return `${inputId.value}-error`;
  if (props.helperText) return `${inputId.value}-helper`;
  return undefined;
});

const isObjectOption = (opt: Option): opt is OptionObject =>
  typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt;

const displayValue = computed<string>(() => {
  const selected = props.options.find((opt) =>
    isObjectOption(opt) ? opt.value === props.modelValue : opt === props.modelValue,
  );
  return selected ? (isObjectOption(selected) ? selected.label : selected) : '';
});

// Methods
const getOptionLabel = (option: Option): string => (isObjectOption(option) ? option.label : option);

const isOptionSelected = (option: Option) =>
  (isObjectOption(option) ? option.value : option) === props.modelValue;

const toggleDropdown = () => {
  if (props.disabled) return;
  dropdownOpen.value = !dropdownOpen.value;
  activeOptionIndex.value = props.options.findIndex(
    (opt) => (isObjectOption(opt) ? opt.value : opt) === props.modelValue,
  );
};

const selectOption = (option: Option) => {
  const value = isObjectOption(option) ? option.value : option;
  emit('update:modelValue', value);
  emit('change', value);
  dropdownOpen.value = false;
};

const handleFocus = (event: Event) => {
  isFocused.value = true;
  emit('focus', event);
};

const handleBlur = () => {
  isFocused.value = false;
  setTimeout(() => (dropdownOpen.value = false), 150);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!dropdownOpen.value && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    toggleDropdown();
    return;
  }

  if (event.key === 'Escape') {
    dropdownOpen.value = false;
    return;
  }

  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    activeOptionIndex.value = Math.max(
      0,
      Math.min(activeOptionIndex.value + direction, props.options.length - 1),
    );
  }

  if (event.key === 'Enter' && activeOptionIndex.value >= 0) {
    event.preventDefault();
    selectOption(props.options[activeOptionIndex.value]);
  }
};

// Lifecycle
onMounted(() => {
  if (inputRef.value) {
    inputRef.value.addEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  if (inputRef.value) {
    inputRef.value.removeEventListener('keydown', handleKeyDown);
  }
});
</script>
