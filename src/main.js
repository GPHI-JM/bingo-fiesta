import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { pinia } from './store/pinia'
import { initFBInstant, isRunningInFBInstant, startGameAsync } from './services/fbInstant.js'

function mountApp() {
  const app = createApp(App)
  app.use(pinia)
  app.mount('#app')
}

async function bootstrapInstantSdk() {
  if (!isRunningInFBInstant()) {
    console.log('Not running in FB Instant environment, skipping SDK initialization')
    return
  }

  console.log('Running in FB Instant environment, initializing SDK...')
  try {
    const initialized = await initFBInstant()
    if (initialized) {
      console.log('FB Instant SDK initialized successfully')
      await startGameAsync()
    } else {
      console.warn('FB Instant SDK initialization failed, continuing without it')
    }
  } catch (error) {
    console.error('FB Instant SDK initialization error:', error)
  }
}

function bootstrap() {
  mountApp()
  void bootstrapInstantSdk()
}

bootstrap()
