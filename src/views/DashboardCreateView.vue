<template>
  <div class="p-8 text-gray-100 max-w-4xl mx-auto" dir="rtl">
    <h2 class="text-2xl font-bold mb-6 text-[#4ade80]">ایجاد داشبورد عملیاتی جدید</h2>

    <form @submit.prevent="createDashboard" class="bg-[#1f1b24] border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- کد داشبورد (dashboard_code) -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">کد داشبورد (یکتا)</label>
          <input v-model="form.dashboard_code" type="text" placeholder="مثال: DASH_SALES_02" required
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none" />
        </div>

        <!-- عنوان (title) -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">عنوان داشبورد</label>
          <input v-model="form.title" type="text" placeholder="مثال: گزارش فروش منطقه ۱" required
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none" />
        </div>
      </div>

      <!-- توضیحات (description) -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">توضیحات عملکردی</label>
        <textarea v-model="form.description" rows="2"
          class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none"></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- نرخ نوسازی (refresh_rate_sec) -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">نرخ بروزرسانی (ثانیه)</label>
          <input v-model.number="form.refresh_rate_sec" type="number"
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none" />
        </div>

        <!-- آیکون (icon_name) -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">نام آیکون (Ph-Icons)</label>
          <input v-model="form.icon_name" type="text" placeholder="مثال: ph-chart-line"
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none" />
        </div>

        <!-- نوع چیدمان (layout_type) -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">نوع چیدمان</label>
          <select v-model="form.layout_type"
            class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none">
            <option value="GRID">شبکه‌ای (GRID)</option>
            <option value="FLEX">شناور (FLEX)</option>
          </select>
        </div>
      </div>

      <!-- تنظیمات تم (JSON) -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">تنظیمات تم (JSON Config)</label>
        <textarea v-model="form.theme_config" rows="3"
          class="w-full bg-[#17151C] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#4ade80] outline-none font-mono text-xs"></textarea>
      </div>

      <!-- وضعیت انتشار -->
      <div class="flex items-center gap-3">
        <input v-model="form.is_public" type="checkbox" id="pub" class="w-5 h-5 accent-[#4ade80]" />
        <label for="pub" class="text-sm text-gray-300">داشبورد عمومی باشد (is_public)</label>
      </div>

      <!-- دکمه ثبت -->
      <div class="pt-4 flex justify-end">
        <button type="submit" class="bg-[#059669] hover:bg-[#10b981] text-white font-bold px-10 py-3 rounded-lg shadow-lg transition">
          درج داشبورد در دیتابیس
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  dashboard_code: '',
  title: '',
  description: '',
  icon_name: 'ph-squares-four',
  layout_type: 'GRID',
  refresh_rate_sec: 30,
  theme_config: '{"bg": "#17151C", "accent": "#4ade80"}',
  is_public: true
})

const createDashboard = async () => {
  console.log('ارسال داده به sys_dashboards:', form.value)
  // اینجا درخواست POST به FastAPI رو بزن
  alert('درخواست ساخت داشبورد ارسال شد.')
}
</script>
