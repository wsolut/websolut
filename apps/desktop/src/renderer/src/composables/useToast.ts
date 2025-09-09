import { useToastStore, ToastType } from '@/stores/toastStore';
import i18n from '@/locales/config/i18n';

export function useToast() {
  const toastStore = useToastStore();

  const show = (payload?: { message?: string } | string, type?: ToastType, duration?: number) => {
    if (!payload) return;

    const message = typeof payload === 'string' ? payload : payload.message;
    if (!message) return;

    toastStore.addToast(message, type, duration);
  };

  return {
    show,
    success: (payload?: { message?: string } | string, duration?: number) =>
      show(payload ?? i18n.global.t('toast.successMessage'), 'success', duration),
    error: (payload?: { message?: string } | string, duration?: number) =>
      show(payload ?? i18n.global.t('toast.errorMessage'), 'error', duration),
    info: (payload?: { message?: string } | string, duration?: number) =>
      show(payload ?? i18n.global.t('toast.infoMessage'), 'info', duration),
  };
}
