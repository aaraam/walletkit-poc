import { createApp } from 'vue'
import App from './App.vue'
import walletKit from './utils/walletKit'

const app = createApp(App)

app.config.globalProperties.$walletKit = walletKit;

app.mount('#app')
