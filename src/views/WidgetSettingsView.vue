<template>
  <div class="p-8 text-gray-100 max-w-5xl mx-auto" dir="rtl">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-[#4ade80]">(DB Target) ساخت ویجت جدید</h2>
    </div>

    <form @submit.prevent="saveWidget" class="bg-[#1f1b24] border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
      
      <!-- ردیف اول: انتخاب داشبورد و کوئری (جایگزین فیلد عددی) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">
            شناسه داشبورد (Dashboard ID)
          </label>
          <select
            v-model="widget.dashboard_id"
            required
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none appearance-none cursor-pointer"
          >
            <option value="" disabled>-- انتخاب از لیست داشبوردها --</option>
            <option v-for="db in dashboards" :key="db.dashboard_id" :value="db.dashboard_id">
              {{ db.title }} (ID: {{ db.dashboard_id }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">
            شناسه کوئری (Query ID)
          </label>
          <select
            v-model="widget.query_id"
            required
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none appearance-none cursor-pointer"
          >
            <option value="" disabled>-- انتخاب از لیست کوئری‌ها --</option>
            <option v-for="q in queries" :key="q.query_id" :value="q.query_id">
              {{ q.report_title }} (ID: {{ q.query_id }})
            </option>
          </select>
        </div>
      </div>

      <!-- عنوان ویجت -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">عنوان ویجت (Widget Title)</label>
        <input
          v-model="widget.widget_title"
          type="text"
          placeholder="Enter title..."
          class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none"
        />
      </div>

      <!-- نوع و ترتیب نمایش -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">نوع ویجت (Widget Type)</label>
          <select
            v-model="widget.widget_type"
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none"
          >
            <option value="TABLE">جدول (TABLE)</option>
            <option value="KPI">کارت عددی (KPI)</option>
            <option value="CHART_BAR">نمودار ستونی</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">ترتیب نمایش (Sort Order)</label>
          <input
            v-model.number="widget.sort_order"
            type="number"
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none"
          />
        </div>
      </div>

      <!-- مختصات گرید (مطابق تصویر) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-gray-400 mb-2">موقعیت X</label>
          <input v-model.number="widget.grid_pos_x" type="number" class="w-full bg-[#17151C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#4ade80]" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-2">موقعیت Y</label>
          <input v-model.number="widget.grid_pos_y" type="number" class="w-full bg-[#17151C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#4ade80]" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-2">عرض</label>
          <input v-model.number="widget.grid_width" type="number" class="w-full bg-[#17151C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#4ade80]" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-2">ارتفاع</label>
          <input v-model.number="widget.grid_height" type="number" class="w-full bg-[#17151C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#4ade80]" />
        </div>
      </div>

      <!-- تنظیمات نمایشی JSON -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">تنظیمات نمایشی (JSON)</label>
        <textarea
          v-model="widget.widget_props"
          rows="4"
          class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none font-mono"
        ></textarea>
      </div>

      <!-- چک باکس فعال بودن -->
      <div class="flex items-center gap-3">
        <input v-model="widget.is_visible" type="checkbox" id="is_active" class="w-5 h-5 accent-[#4ade80]" />
        <label for="is_active" class="text-sm text-gray-300">ویجت فعال باشد</label>
      </div>

      <!-- دکمه ذخیره -->
      <div class="pt-4 flex justify-end">
        <button
          type="submit"
          class="bg-[#059669] hover:bg-[#10b981] text-white font-bold px-10 py-3 rounded-lg transition duration-200 shadow-lg"
        >
          ذخیره در دیتابیس
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const BASE_URL = 'http://127.0.0.1:8000'

const dashboards = ref([])
const queries = ref([])

const widget = ref({
  dashboard_id: '',
  query_id: '',
  widget_title: '',
  widget_type: 'TABLE',
  grid_pos_x: 0,
  grid_pos_y: 0,
  grid_width: 6,
  grid_height: 4,
  widget_props: '{}',
  sort_order: 0,
  is_visible: true
})

// دریافت مستقیم داده‌ها از جداول مربوطه در دیتابیس
const fetchReferenceData = async () => {
  try {
    // ۱. لیست کوئری‌ها (اندپوینت موجود در پروژه شما)
    const qRes = await fetch(`${BASE_URL}/api/admin/dashboard/queries`)
    if (qRes.ok) queries.value = await qRes.json()

    // ۲. لیست داشبوردها (اندپوینت دومی که باید در بک‌اند اضافه شده باشد)
    const dRes = await fetch(`${BASE_URL}/dashboards/list`)
    if (dRes.ok) dashboards.value = await dRes.json()
  } catch (error) {
    console.error('Error fetching DB records:', error)
  }
}

const saveWidget = async () => {
  console.log('ارسال رکورد نهایی به جدول sys_dashboard_widgets:', widget.value)
  // اینجا درخواست POST رو به بک‌اندر ارسال کن
  alert('آماده برای ثبت در دیتابیس! خروجی در کنسول را ببین هادی جان.')
}

onMounted(fetchReferenceData)
</script>
