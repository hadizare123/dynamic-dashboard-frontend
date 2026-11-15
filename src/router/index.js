import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'

const routes = [
  {
    path: '/',
    redirect: '/main'
  },
  {
    path: '/main',
    name: 'main',
    component: MainView
  },
  {
    path: '/dashboard/settings',
    name: 'dashboard-settings',
    component: () => import('../views/DashboardSettingsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    
  },
  {
    path: '/dashboard/:id',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
  path: '/admin/widget-settings',
  name: 'WidgetSettings',
  component: () => import('../views/WidgetSettingsView.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/admin/dashboard-create',
  name: 'dashboard-create',
  component: () => import('../views/DashboardCreateView.vue')
}

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
