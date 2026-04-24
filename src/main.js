import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { pinia } from './store/pinia'

function mountApp() {
  const app = createApp(App)
  app.use(pinia)
  app.mount('#app')
}

mountApp()
