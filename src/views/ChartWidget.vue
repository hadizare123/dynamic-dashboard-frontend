<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  status: { type: String, default: 'OK' }
})

const canvasRef = ref(null)
let chartInstance = null

/* ---------- پارس تنظیمات ویجت ---------- */
const props_ = computed(() => {
  const raw = props.widget?.widgetProps
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
})

/* ---------- تشخیص نوع نمودار ---------- */
const chartType = computed(() => {
  const type = props.widget?.widgetType?.toLowerCase() || ''
  if (type.includes('pie')) return 'pie'
  if (type.includes('line')) return 'line'
  if (type.includes('doughnut')) return 'doughnut'
  return 'bar' // پیش‌فرض
})

/* ---------- آماده‌سازی دیتا برای Chart.js ---------- */
const prepareData = () => {
  const rows = props.data || []
  if (rows.length === 0) return { labels: [], datasets: [] }

  // ۱. پیدا کردن ستون لیبل (اولین ستون متنی)
  const labelKey = props_.value.labelColumn || Object.keys(rows[0]).find(k => typeof rows[0][k] === 'string') || 'id'
  
  // ۲. پیدا کردن ستون مقدار (اولین ستون عددی)
  const valueKey = props_.value.valueColumn || Object.keys(rows[0]).find(k => !isNaN(Number(rows[0][k])) && k !== labelKey) || 'value'

  const labels = rows.map(r => r[labelKey])
  const values = rows.map(r => Number(r[valueKey]))

  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'
  ]

  return {
    labels,
    datasets: [{
      label: props.widget.widgetTitle || 'مقدار',
      data: values,
      backgroundColor: chartType.value === 'pie' || chartType.value === 'doughnut' ? colors : '#6366f1cc',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 6,
      hoverOffset: 15
    }]
  }
}

/* ---------- رندر نمودار ---------- */
const renderChart = () => {
  if (chartInstance) chartInstance.destroy()
  if (!canvasRef.value) return

  const config = {
    type: chartType.value,
    data: prepareData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType.value === 'pie' || chartType.value === 'doughnut',
          position: 'bottom',
          labels: { color: '#94a3b8', font: { family: 'Vazirmatn, sans-serif', size: 11 } }
        },
        tooltip: {
          bodyFont: { family: 'Vazirmatn' },
          titleFont: { family: 'Vazirmatn' }
        }
      },
      scales: chartType.value === 'bar' || chartType.value === 'line' ? {
        y: { 
          beginAtZero: true, 
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { size: 10 } }
        },
        x: { 
          grid: { display: false },
          ticks: { color: '#64748b', font: { family: 'Vazirmatn', size: 10 } }
        }
      } : {}
    }
  }

  chartInstance = new Chart(canvasRef.value, config)
}

// گوش دادن به تغییرات دیتا برای آپدیت لحظه‌ای
watch(() => props.data, () => renderChart(), { deep: true })

onMounted(() => renderChart())
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>

<template>
  <div class="glass-card relative flex h-full flex-col overflow-hidden rounded-2xl p-5">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-medium text-slate-300">
        {{ widget.widgetTitle || 'نمودار' }}
      </h3>
      <div class="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
    </div>

    <div class="relative flex-1 min-h-[200px]">
      <template v-if="status === 'OK' && data.length > 0">
        <canvas ref="canvasRef"></canvas>
      </template>
      
      <template v-else-if="status !== 'OK'">
        <div class="flex h-full flex-col items-center justify-center text-rose-400">
          <span class="text-xs">خطا در بارگذاری داده</span>
        </div>
      </template>

      <template v-else>
        <div class="flex h-full items-center justify-center text-slate-600">
          <span class="text-xs italic">داده‌ای یافت نشد</span>
        </div>
      </template>
    </div>
  </div>
</template>
