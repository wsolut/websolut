<template>
  <div class="relative flex flex-col" :class="customClass">
    <!-- Label -->
    <label v-if="label" :for="inputId" :class="props.labelClass">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1" aria-label="required">*</span>
    </label>

    <!-- Textarea container -->
    <div class="relative">
      <div
        class="flex items-start rounded-md transition-colors duration-150 border-1 border-gray-700"
        :class="[
          disabled ? 'bg-gray-950' : 'bg-[#0F1519]',
          isFocused ? focusedBorderClass : `${borderClass} ${SHADOW_CLASSES}`,
        ]"
      >
        <textarea
          ref="inputRef"
          v-model="inputValue"
          @focus="
            isFocused = true;
            $emit('focus', $event);
          "
          @blur="
            isFocused = false;
            $emit('blur', $event);
          "
          @input="handleInput"
          :id="inputId"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :readonly="readonly"
          :autocomplete="autocomplete"
          :rows="rows"
          :class="[
            BASE_TEXTAREA_CLASSES,
            paddingClasses,
            textColorClasses,
            resizeClass,
            'min-h-[80px]',
            'font-extralight',
          ]"
          :aria-invalid="!!errorBubble"
          :aria-describedby="ariaDescribedBy"
          :aria-required="required"
          v-bind="$attrs"
        />
        <div
          v-if="errorBubble"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm"
        >
          ❗
        </div>
      </div>

      <!-- Floating bubble for validation errors -->
      <div
        v-if="errorBubble"
        class="fade-in absolute right-0 -top-8 z-10 transform transition-opacity duration-500 max-w-[300px]"
        :id="inputId + '-error'"
      >
        <div
          class="relative rounded-md bg-red-700 px-2 py-1 text-xs font-semibold text-white break-words"
        >
          {{ errorBubble }}
          <div class="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-red-700"></div>
        </div>
      </div>
    </div>

    <!-- Helper text (inline) -->
    <div
      v-if="helperText && !invalid"
      :id="inputId + '-helper'"
      class="text-xs text-neutral-400 mt-1 px-1.5"
      role="note"
    >
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    id?: string;
    placeholder?: string;
    label?: string;
    helperText?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    modelValue?: string | number;
    autocomplete?: string;
    variant?: string;
    customClass?: string;
    rows?: number;
    resizeable?: boolean;
    errors?: string[];
    errorMessage?: string;
    labelClass?: string;
  }>(),
  {
    id: '',
    placeholder: '',
    label: '',
    helperText: '',
    disabled: false,
    readonly: false,
    required: false,
    modelValue: '',
    autocomplete: 'off',
    variant: '',
    customClass: 'w-72',
    rows: 4,
    resizeable: true,
    errorMessage: '',
    labelClass: '',
  },
);

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input']);

// Refs and state
const inputId = ref(props.id);
const inputRef = ref<HTMLTextAreaElement>();
const isFocused = ref(false);

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const invalid = computed(() => props.errors && props.errors.length > 0);

const errorBubble = ref('');
watch(
  () => [props.errorMessage, props.errors],
  () => {
    const backend = props.errors ? props.errors.join(', ') : '';
    errorBubble.value = props.errorMessage || backend || '';
  },
  { immediate: true },
);

// Configuration
const BASE_TEXTAREA_CLASSES = 'bg-transparent w-full focus:outline-none py-2';
const SHADOW_CLASSES = 'shadow-[inset_0_0_0_2px_rgba(0,0,0,0.65)]';

// Computed properties
const paddingClasses = computed(() => 'px-3');

const borderClass = computed(() => {
  if (errorBubble.value) return 'border-red-500';
  if (props.disabled) return 'border-[#232E36]';
  return props.variant ? `border-${props.variant}` : 'border-gray-700';
});

const focusedBorderClass = computed(() => {
  if (errorBubble.value) return 'border-red-500';
  return props.variant ? `border-${props.variant}-light` : 'border-white';
});

const textColorClasses = computed(() => {
  if (props.disabled) return 'text-[#505A64]';
  return 'text-neutral-200';
});

const resizeClass = computed(() => (props.resizeable ? 'resize-y' : 'resize-none'));

const ariaDescribedBy = computed(() => {
  const ids: string[] = [];
  if (props.helperText && !errorBubble.value) ids.push(`${inputId.value}-helper`);
  if (invalid.value) ids.push(`${inputId.value}-error`);
  return ids.length ? ids.join(' ') : undefined;
});

const handleInput = (event: Event) => {
  const value = (event.target as HTMLTextAreaElement).value;
  emit('update:modelValue', value);
  // clear bubble while typing
  errorBubble.value = '';

  autoResize();
};

const autoResize = () => {
  if (inputRef.value) {
    // Reset height to auto to get correct scrollHeight
    inputRef.value.style.height = 'auto';
    // Set new height based on content, but cap at 128px (max-h-32)
    const newHeight = Math.min(inputRef.value.scrollHeight, 128);
    inputRef.value.style.height = `${newHeight}px`;
  }
};

// Initialization
onMounted(() => {
  if (!inputId.value) inputId.value = `textarea-${Math.random().toString(36).substring(2, 9)}`;
});

// Public methods
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
  inputRef,
  autoResize,
});
</script>
