<script setup>
import { onMounted, ref } from 'vue'

const dashboards = ref([])
const loading = ref(true)
const loadFailed = ref(false)

async function loadDashboards() {
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

onMounted(loadDashboards)
</script>

<template>
  <main class="flex-1 p-10 overflow-y-auto bg-[#17151C]">
    <div class="max-w-5xl mx-auto text-center">
      <header class="mb-10">
        <h2 class="text-3xl font-extrabold text-white tracking-tight">خوش آمدید، هادی عزیز 👋</h2>
        <p class="text-gray-400 mt-3 text-sm leading-relaxed max-w-2xl mx-auto">
          برای دسترسی به گزارش‌ها، ویجت‌های تحلیلی و وضعیت زنده‌ی دیتابیس از بخش‌های زیر استفاده کنید.
        </p>
      </header>

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          همه داشبوردها
        </h3>

        <p v-if="loading" role="status" class="text-sm text-gray-400">در حال دریافت داشبوردها…</p>
        <div v-else-if="loadFailed" role="alert" class="text-sm text-gray-400">
          دریافت فهرست داشبوردها ممکن نشد.
          <button type="button" class="mr-2 text-blue-400" @click="loadDashboards">تلاش دوباره</button>
        </div>
        <p v-else-if="!dashboards.length" class="text-sm text-gray-400">هنوز داشبوردی ثبت نشده است.</p>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          <router-link
            v-for="dashboard in dashboards"
            :key="dashboard.dashboard_id"
            :to="{ name: 'dashboard', params: { id: dashboard.dashboard_id } }"
            class="group w-full max-w-sm bg-[#1f1b24] border border-gray-800 hover:border-blue-500/60 p-6 rounded-2xl transition duration-200 shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between text-center"
          >
            <div>
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition duration-200">
                📊
              </div>
              <h4 class="text-xl font-bold text-white group-hover:text-blue-400 transition">
                {{ dashboard.title }}
              </h4>
              <p v-if="dashboard.description" class="text-gray-400 text-xs mt-2 leading-relaxed">
                {{ dashboard.description }}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-center gap-2 text-xs text-blue-400 font-medium">
              <span>ورود به داشبورد</span>
              <span class="transform group-hover:-translate-x-1 transition duration-200">←</span>
            </div>
          </router-link>
        </div> 
      </section>
    </div>
  </main>
</template>
