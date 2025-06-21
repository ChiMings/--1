import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// 初始化用户状态
const userStore = useUserStore()
userStore.initializeFromStorage()

app.mount('#app')
