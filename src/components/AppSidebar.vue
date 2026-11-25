<template>
  <aside
    :class="[
      'sticky top-0 z-20 h-screen overflow-y-auto bg-[#1f1b24] border-l border-gray-800 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-20 p-3' : 'w-64 p-6'
    ]"
  >
    <div>
      <!-- هدر سایدبار + دکمه جمع‌شونده -->
      <div
        :class="[
          'flex items-center mb-8 pb-4 border-b border-gray-800/80',
          isCollapsed ? 'justify-center' : 'justify-between gap-3'
        ]"
      >
        <div v-if="!isCollapsed" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner shrink-0">
            ⚡
          </div>
          <div class="whitespace-nowrap">
            <h1 class="text-base font-bold text-white tracking-wide">سامانه داده‌ها</h1>
            <p class="text-xs text-blue-400 font-medium">داشبورد یکپارچه</p>
          </div>
        </div>

        <button
          @click="isCollapsed = !isCollapsed"
          class="w-9 h-9 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition shrink-0"
          :title="isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'"
        >
          <span class="text-lg leading-none">{{ isCollapsed ? '☰' : '✕' }}</span>
        </button>
      </div>

      <!-- لینک‌های منو -->
      <nav class="space-y-2">
        <!-- منوهای عادی -->
        <router-link
          to="/main"
          :title="isCollapsed ? 'صفحه اصلی' : ''"
          :class="[
            'flex items-center rounded-xl transition',
            isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
            isActive('/main')
              ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30 shadow-sm'
              : 'text-gray-300 hover:bg-gray-800/70 hover:text-white border border-transparent'
          ]"
        >
          <span class="text-lg shrink-0">📊</span>
          <span v-if="!isCollapsed" class="whitespace-nowrap">صفحه اصلی</span>
        </router-link>

        <div class="space-y-1">
          <button
            type="button"
            aria-controls="dashboard-list"
            :aria-expanded="dashboardsOpen && !isCollapsed"
            :title="isCollapsed ? 'لیست داشبوردها' : ''"
            @click="toggleDashboards"
            :class="[
              'w-full flex items-center rounded-xl transition',
              isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-4 py-3',
              route.name === 'dashboard' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:bg-gray-800/70 border border-transparent'
            ]"
          >
            <span class="flex items-center gap-3">📈 <span v-if="!isCollapsed">لیست داشبوردها</span></span>
            <span v-if="!isCollapsed" aria-hidden="true" class="text-xs transition-transform" :class="{ 'rotate-180': dashboardsOpen }">▼</span>
          </button>
          <div id="dashboard-list" v-show="dashboardsOpen && !isCollapsed" class="pr-4 space-y-1 border-r border-gray-800 mr-4">
            <p v-if="loading" class="p-2 text-sm text-gray-400">در حال دریافت داشبوردها…</p>
            <button v-else-if="loadFailed" class="p-2 text-sm text-blue-400" @click="loadDashboards">دریافت فهرست ناموفق بود؛ تلاش دوباره</button>
            <p v-else-if="!dashboards.length" class="p-2 text-sm text-gray-400">داشبوردی ثبت نشده است.</p>
            <router-link
              v-for="dashboard in dashboards"
              :key="dashboard.dashboard_id"
              :to="{ name: 'dashboard', params: { id: dashboard.dashboard_id } }"
              class="block px-3 py-2 rounded-lg text-sm hover:bg-gray-800/50"
              :class="route.name === 'dashboard' && route.params.id === String(dashboard.dashboard_id) ? 'text-blue-400 bg-blue-600/10' : 'text-gray-400 hover:text-white'"
            >{{ dashboard.title }}</router-link>
          </div>
        </div>

        <!-- منوی والد: تنظیمات و زیرمجموعه‌ها -->
        <div class="space-y-1">
          <button
            @click="toggleSettings"
            :title="isCollapsed ? 'تنظیمات' : ''"
            :class="[
              'w-full flex items-center justify-between rounded-xl transition',
              isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3',
              isSettingsActive ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30' : 'text-gray-300 hover:bg-gray-800/70 hover:text-white border border-transparent'
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg shrink-0">⚙️</span>
              <span v-if="!isCollapsed" class="whitespace-nowrap">تنظیمات</span>
            </div>
            <span v-if="!isCollapsed" class="text-xs transition-transform duration-200" :class="{ 'rotate-180': settingsOpen }">
              ▼
            </span>
          </button>

          <!-- زیرمجموعه‌های تنظیمات -->
          <div v-show="settingsOpen && !isCollapsed" class="pr-4 space-y-1 border-r border-gray-800 mr-4">
            <router-link
              to="/dashboard/settings"
              :class="[
                'block px-3 py-2 rounded-lg text-sm transition',
                isActive('/dashboard/settings') ? 'text-blue-400 font-medium bg-blue-600/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              ]"
            >
              ساخت کوئری
            </router-link>
            <router-link
              to="/admin/widget-settings"
              :class="[
                'block px-3 py-2 rounded-lg text-sm transition',
                isActive('/admin/widget-settings') ? 'text-blue-400 font-medium bg-blue-600/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              ]"
            >
              ساخت ویجت
            </router-link>

            <router-link to="/admin/dashboard-create" class="block p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
             ساخت داشبورد
             </router-link>

            
          </div>
        </div>
        <router-link to="/admin/dashboard-design" title="طراحی پیشرفته" aria-label="طراحی پیشرفته"
          class="flex items-center gap-3 rounded-xl py-3 transition"
          :class="[isCollapsed ? 'justify-center' : 'px-4', isActive('/admin/dashboard-design') ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-800/70']">
          <span aria-hidden="true">▦</span>
          <span v-if="!isCollapsed" class="whitespace-nowrap">طراحی پیشرفته</span>
        </router-link>
      </nav>
    </div>

    <!-- فوتر سایدبار -->
    <div
      :class="[
        'text-xs text-gray-500 border-t border-gray-800/80 pt-4',
        isCollapsed ? 'text-center' : 'text-center whitespace-nowrap'
      ]"
    >
      {{ isCollapsed ? 'v1.0' : 'سیستم یکپارچه داده‌ها - نسخه ۱.۰' }}
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapsed = ref(window.matchMedia("(max-width: 767px)").matches)
const settingsOpen = ref(true)

const dashboardsOpen = ref(route.name === 'dashboard')
const dashboards = ref([])
const loading = ref(false)
const loadFailed = ref(false)

async function loadDashboards() {
  if (loading.value) return
  loading.value = true
  loadFailed.value = false
  try {
    const response = await fetch('http://127.0.0.1:8000/dashboards/list')
    if (!response.ok) throw new Error(String(response.status))
    const list = await response.json()
    if (!Array.isArray(list)) throw new Error('Invalid dashboard list')
    dashboards.value = list
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

function toggleDashboards() {
  dashboardsOpen.value = isCollapsed.value || !dashboardsOpen.value
  isCollapsed.value = false
}

watch(() => dashboardsOpen.value && !isCollapsed.value, visible => {
  if (visible) loadDashboards()
}, { immediate: true })

const isActive = (path) => route.path === path
const isSettingsActive = computed(() => ['/dashboard/settings', '/admin/widget-settings'].includes(route.path))

const toggleSettings = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false
    settingsOpen.value = true
    return
  }
  settingsOpen.value = !settingsOpen.value
}
</script>
