import { reactive } from 'vue';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const state = reactive<{ toasts: Toast[] }>({
  toasts: [],
});

let counter = 0;

export function useToastStore() {
  const addToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = counter++;
    state.toasts.push({ id, message, type });

    setTimeout(() => {
      const index = state.toasts.findIndex((t) => t.id === id);
      if (index !== -1) state.toasts.splice(index, 1);
    }, duration);
  };

  const removeToast = (id: number) => {
    const index = state.toasts.findIndex((t) => t.id === id);
    if (index !== -1) state.toasts.splice(index, 1);
  };

  return { toasts: state.toasts, addToast, removeToast };
}
