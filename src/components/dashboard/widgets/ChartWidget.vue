<template>
  <div class="bg-[#292531] border border-gray-800 rounded-2xl shadow-xl flex flex-col h-full" :class="chartType === 'doughnut' ? 'p-4' : 'p-6'" dir="rtl">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-base font-bold text-white">{{ title }}</h3>
      <span class="text-xs text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
        {{ chartTypeLabel }}
      </span>
    </div>

    <!-- کانتینر نمودار -->
    <div class="relative min-h-0 min-w-0 flex-1 w-full">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController, LineElement, PointElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  PieController
} from 'chart.js'

// ثبت ماژول‌های لازم Chart.js
Chart.register(
  LineController, LineElement, PointElement,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  PieController
)

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Array, default: () => [] }
})

const chartCanvas = ref(null)
let chartInstance = null

const title = computed(() => props.widget.widgetTitle || 'نمودار آماری')
const settings = computed(() => {
  const raw = props.widget.widgetProps
  if (typeof raw !== 'string') return raw ?? {}
  try { return JSON.parse(raw) ?? {} } catch { return {} }
})

// استخراج نوع نمودار از widgetProps یا widgetType
const chartType = computed(() => {
  if (settings.value.chartType) return settings.value.chartType

  if (props.widget.widgetType === 'CHART_PIE') return 'doughnut'
  if (props.widget.widgetType === 'CHART_LINE') return 'line'
  return 'bar'
})

const chartTypeLabel = computed(() => {
  return chartType.value === 'doughnut' ? 'نمودار دایره‌ای' : chartType.value === 'line' ? 'نمودار خطی' : 'نمودار ستونی'
})

onMounted(() => {
  if (!chartCanvas.value || !props.data.length) return

  // پارس کردن تنظیمات ویجت برای تشخیص محورها
  const xField = settings.value.labels ?? settings.value.x ?? 'product_category'
  const yField = settings.value.data ?? settings.value.y ?? 'total_orders'

  const labels = props.data.map(item => item[xField] ?? 'نامشخص')
  const values = props.data.map(item => item[yField] == null ? null : Number(item[yField]))

  const isDoughnut = chartType.value === 'doughnut'
  const sliceOffset = 24
  const sliceClearance = sliceOffset + 8

  const config = {
    plugins: [{
      id: 'chartDepth',
      beforeDatasetDraw(chart, { meta }) {
        const context = chart.ctx
        const depth = Math.min(8, Math.max(3, Math.round(chart.chartArea.height / 26)))
        for (let layer = depth; layer > 0; layer--) {
          context.save()
          context.translate(-layer * 0.65, layer)
          context.filter = 'brightness(' + (0.32 + 0.38 * (1 - layer / depth)) + ')'
          if (meta.dataset) meta.dataset.draw(context, chart.chartArea)
          for (const element of meta.data) {
            if (!element.hidden && !element.skip) element.draw(context, chart.chartArea)
          }
          context.restore()
        }
      }
    }],
    type: isDoughnut ? 'doughnut' : chartType.value === 'line' ? 'line' : 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: title.value,
          data: values,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: chartType.value === 'line' ? '#93c5fd' : 'rgba(255,255,255,0.65)',
          borderWidth: chartType.value === 'line' ? 4 : 2,
          pointRadius: 5,
          pointBorderColor: '#dbeafe',
          clip: isDoughnut ? sliceClearance : { left: 11, bottom: 15, right: 5, top: 5 },
          borderRadius: isDoughnut ? 0 : 6,
          ...(isDoughnut ? { hoverOffset: sliceOffset } : {})
        }
      ]
    },
    options: {
      layout: { padding: isDoughnut ? sliceClearance : { left: 12, bottom: 16 } },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isDoughnut,
          position: 'bottom',
          labels: {
            padding: 16,
            color: '#9CA3AF',
            font: { family: 'Tahoma', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: '#1E1B26',
          titleColor: '#FFFFFF',
          bodyColor: '#E5E7EB',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: isDoughnut ? {} : {
        x: {
          grid: { display: false, color: '#374151' },
          ticks: { padding: 10, color: '#9CA3AF', font: { family: 'Tahoma', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(55, 65, 81, 0.4)' },
          ticks: { color: '#9CA3AF', font: { family: 'Tahoma', size: 11 } }
        }
      }
    }
  }

  chartInstance = new Chart(chartCanvas.value, config)
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>
