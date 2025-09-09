import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router/main';
import i18n from './locales/config/i18n';

const app = createApp(App);

app.use(i18n);
app.use(router);
app.mount('#app');
