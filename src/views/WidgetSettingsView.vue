<template>
  <div class="p-6 max-w-4xl mx-auto text-white">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-emerald-400">ساخت ویجت جدید (DB Target)</h1>
      <button 
        @click="fetchReferenceData" 
        class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-600 transition"
      >
        بارگذاری مجدد لیست‌ها
      </button>
    </div>

    <!-- پیام خطا یا هشدار کلی -->
    <div v-if="fetchError" class="mb-6 p-4 bg-red-900/60 border border-red-500 rounded text-red-200 text-sm">
      {{ fetchError }}
    </div>

    <form @submit.prevent="saveWidget" class="space-y-6 bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- انتخاب داشبورد -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">انتخاب داشبورد</label>
          <select 
            v-model="form.dashboardId" 
            required 
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option :value="null" disabled>-- یک داشبورد انتخاب کنید --</option>
            <option v-for="dash in dashboards" :key="dash.dashboard_id" :value="dash.dashboard_id">
              {{ dash.title }} (شناسه: {{ dash.dashboard_id }})
            </option>
          </select>
        </div>

        <!-- انتخاب کوئری منبع (فقط کوئری‌های فعال نمایش داده می‌شوند) -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">انتخاب کوئری منبع</label>
          <select 
            v-model="form.queryId" 
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option :value="null">-- یک کوئری انتخاب کنید (اختیاری) --</option>
            <option v-for="q in activeQueries" :key="q.query_id" :value="q.query_id">
              {{ q.report_title }} (شناسه: {{ q.query_id }})
            </option>
          </select>
        </div>
      </div>

      <!-- عنوان ویجت -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">عنوان ویجت (Widget Title)</label>
        <input 
          v-model="form.widgetTitle" 
          type="text" 
          required 
          placeholder="مثال: نمودار فروش ماهانه" 
          class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- نوع ویجت -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">نوع ویجت (Widget Type)</label>
          <select 
            v-model="form.widgetType" 
            required 
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="TABLE">جدول (TABLE)</option>
            <option value="KPI">کارت آماری (KPI)</option>
            <option value="CHART_BAR">نمودار ستونی (CHART_BAR)</option>
            <option value="CHART_LINE">نمودار خطی (CHART_LINE)</option>
            <option value="CHART_PIE">نمودار دایره‌ای (CHART_PIE)</option>
          </select>
        </div>

        <!-- ترتیب نمایش -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">ترتیب نمایش (Sort Order)</label>
          <input 
            v-model.number="form.sortOrder" 
            type="number" 
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <!-- موقعیت در گرید -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">موقعیت X</label>
          <input v-model.number="form.gridPosX" type="number" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">موقعیت Y</label>
          <input v-model.number="form.gridPosY" type="number" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">عرض (Grid Width)</label>
          <input v-model.number="form.gridWidth" type="number" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">ارتفاع (Grid Height)</label>
          <input v-model.number="form.gridHeight" type="number" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
        </div>
      </div>

      <!-- تنظیمات JSON -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">تنظیمات نمایشی (JSON Props)</label>
        <textarea 
          v-model="form.widgetProps" 
          rows="3" 
          dir="ltr"
          class="w-full font-mono text-sm bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
        ></textarea>
      </div>

      <!-- وضعیت فعال بودن ویجت -->
      <div class="flex items-center gap-2">
        <input 
          id="isVisible" 
          v-model="form.isVisible" 
          type="checkbox" 
          class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500" 
        />
        <label for="isVisible" class="text-sm font-medium text-slate-300">ویجت فعال و نمایان باشد</label>
      </div>

      <button 
        type="submit" 
        class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg shadow-md transition"
      >
        ذخیره در دیتابیس
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const BASE_URL = 'http://127.0.0.1:8000'

const dashboards = ref([])
const queries = ref([])
const fetchError = ref('')

// فیلتر کردن هوشمند: در فرم ساخت ویجت فقط کوئری‌های فعال را نمایش می‌دهیم
const activeQueries = computed(() => {
  return queries.value.filter(q => q.is_active === true || q.is_active === undefined)
})

const form = reactive({
  dashboardId: null,
  queryId: null,
  widgetTitle: '',
  widgetType: 'TABLE',
  gridPosX: 0,
  gridPosY: 0,
  gridWidth: 6,
  gridHeight: 4,
  widgetProps: '{}',
  sortOrder: 0,
  isVisible: true
})

const fetchReferenceData = async () => {
  fetchError.value = ''
  try {
    // ۱. دریافت کوئری‌ها (همه از سرور خوانده می‌شوند اما با computed فقط فعال‌ها در سلکتور لیست می‌شوند)
    const qRes = await fetch(`${BASE_URL}/api/admin/dashboard/queries`)
    if (qRes.ok) {
      queries.value = await qRes.json()
    } else {
      fetchError.value = `خطا در دریافت کوئری‌ها: وضعیت ${qRes.status}`
    }

    // ۲. دریافت داشبوردها
    const dRes = await fetch(`${BASE_URL}/dashboards/list`)
    if (dRes.ok) {
      dashboards.value = await dRes.json()
    } else {
      fetchError.value = (fetchError.value ? fetchError.value + ' | ' : '') + `خطا در دریافت داشبوردها: وضعیت ${dRes.status}`
    }
  } catch (err) {
    console.error('Error fetching records:', err)
    fetchError.value = err.message || 'خطا در ارتباط با سرور'
  }
}

const saveWidget = () => {
  console.log('Widget Form Submitted:', form)
  alert('ویجت آماده ذخیره است (اطلاعات در کنسول لاگ شد)')
}

onMounted(() => {
  fetchReferenceData()
})
</script>
