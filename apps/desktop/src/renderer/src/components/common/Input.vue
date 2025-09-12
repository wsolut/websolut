<template>
  <div class="relative flex flex-col" :class="customClass">
    <label v-if="label" :for="inputId" :class="props.labelClass">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1" aria-label="required">*</span>
    </label>

    <div class="relative">
      <div
        class="flex items-center rounded-md transition-colors duration-150 border-1 border-gray-700"
        :class="[
          SIZE_CONFIG[size].height,
          disabled ? 'bg-gray-950' : 'bg-[#0F1519]',
          isFocused ? focusedBorderClass : `${borderClass} ${SHADOW_CLASSES}`,
        ]"
      >
        <input
          class="font-extralight"
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
          @input="onInput"
          :id="inputId"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :readonly="readonly"
          :type="inputType"
          :autocomplete="autocomplete"
          :class="[BASE_INPUT_CLASSES, paddingClasses, textColorClasses]"
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

        <button
          v-if="showActionButton"
          @click="$emit('action-button-click')"
          type="button"
          :class="[
            'p-1 rounded hover:bg-gray-800 transition-colors duration-150 flex items-center justify-center',
            { 'mr-1': !errorBubble },
            { 'mr-8': errorBubble },
          ]"
          :disabled="disabled"
        >
          <Icon :icon="actionButtonIcon || ''" class="text-xl" />
        </button>
      </div>

      <!-- Floating bubble for validation errors -->
      <div
        v-if="errorBubble"
        class="fade-in absolute right-0 -top-8 z-10 transform transition-opacity duration-500"
      >
        <div class="relative rounded-md bg-red-700 px-2 py-1 text-xs font-semibold text-white">
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

    <Hint v-if="(hint ?? '') !== ''" :variant="'secondary'">
      {{ hint }}
    </Hint>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Hint from '@/components/common/Hint.vue';
import { Icon } from '@iconify/vue';

const props = withDefaults(
  defineProps<{
    id?: string;
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
    label?: string;
    helperText?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    modelValue?: string | number;
    inputType?: string;
    autocomplete?: string;
    variant?: string;
    hint?: string;
    customClass?: string;
    errors?: string[];
    errorMessage?: string;
    actionButtonIcon?: string;
    labelClass?: string;
  }>(),
  {
    id: '',
    size: 'md',
    placeholder: '',
    label: '',
    helperText: '',
    disabled: false,
    readonly: false,
    required: false,
    modelValue: '',
    inputType: 'text',
    autocomplete: 'off',
    variant: '',
    hint: '',
    customClass: 'w-72',
    errorMessage: '',
    labelClass: '',
  },
);

const emit = defineEmits(['update:modelValue', 'action-button-click', 'focus', 'blur', 'input']);

// Refs and state
const inputId = ref(props.id);
const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);
const showActionButton = computed(() => (props.actionButtonIcon ?? '') !== '');

console.log('props.actionButtonIcon', props.actionButtonIcon);

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

const SIZE_CONFIG = {
  sm: { height: 'h-8', padding: 'px-3' },
  md: { height: 'h-10', padding: 'px-4' },
  lg: { height: 'h-12', padding: 'px-4' },
} as const;

const BASE_INPUT_CLASSES = 'bg-transparent w-full focus:outline-none';
const SHADOW_CLASSES = 'shadow-[inset_0_0_0_2px_rgba(0,0,0,0.65)]';
const paddingClasses = computed(() => SIZE_CONFIG[props.size].padding);

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', value);
  // clear bubble while typing
  errorBubble.value = '';
};

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

const ariaDescribedBy = computed(() => {
  const ids: string[] = [];
  if (props.helperText && !invalid.value) ids.push(`${inputId.value}-helper`);
  if (invalid.value) ids.push(`${inputId.value}-error`);
  return ids.length ? ids.join(' ') : undefined;
});

// Initialization
onMounted(() => {
  if (!inputId.value) inputId.value = `input-${Math.random().toString(36).substring(2, 9)}`;
});

// Public methods
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
  inputRef,
});
</script>
