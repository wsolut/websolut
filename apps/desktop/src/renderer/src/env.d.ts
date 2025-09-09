/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

// Global variables defined by Vite

declare module '*.svg#file' {
  const src: string;
  export default src;
}
