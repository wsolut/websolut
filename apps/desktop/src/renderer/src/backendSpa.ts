import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router/backendSpa';
import i18n from '@/locales/config/i18n';

const app = createApp(App);
app.use(i18n);
app.use(router);
app.mount('#app');
