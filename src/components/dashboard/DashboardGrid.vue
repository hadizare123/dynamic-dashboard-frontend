<template>
  <div
    v-if="widgets.length"
    class="dashboard-grid-surface grid grid-cols-12 gap-6 items-start"
  >
    <div
      v-for="item in widgets"
      :key="item.widget.widgetId"
      class="col-span-12 min-w-0"
      :class="getColSpanClass(item.widget.gridWidth)"
      :style="getWidgetContainerStyle(item.widget.gridHeight)"
    >
      <component
        v-if="item.widget.isVisible !== false"
        :is="getWidgetComponent(item.widget.widgetType)"
        :widget="item.widget"
        :data="item.data ?? []"
        :columns="item.columns ?? []"
        :status="item.status ?? 'OK'"
        class="h-full"
      />
    </div>
  </div>

  <div
    v-else
    class="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-gray-400"
  >
    هیچ ویجتی برای نمایش وجود ندارد.
  </div>
</template>

<script setup>
import KpiCard from './widgets/KpiCard.vue'
import DataGridWidget from './widgets/DataGridWidget.vue'
import ChartWidget from './widgets/ChartWidget.vue'

defineProps({
  widgets: {
    type: Array,
    default: () => []
  }
})

/*
 * ارتفاع هر واحد گرید بر حسب پیکسل.
 * مثال:
 * gridHeight = 4
 * ارتفاع نهایی = 4 × 80 = 320px
 */
const GRID_HEIGHT_UNIT = 80

/*
 * محدودیت ارتفاع برای جلوگیری از ثبت مقادیر خراب یا غیرمنطقی.
 */
const MIN_GRID_HEIGHT = 1
const MAX_GRID_HEIGHT = 20

const spanClasses = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12'
}

function normalizeGridWidth(width) {
  const numericWidth = Number(width)

  if (!Number.isFinite(numericWidth)) {
    return 4
  }

  return Math.min(12, Math.max(1, Math.round(numericWidth)))
}

function getColSpanClass(width) {
  const normalizedWidth = normalizeGridWidth(width)
  return spanClasses[normalizedWidth]
}

function normalizeGridHeight(height) {
  const numericHeight = Number(height)

  if (!Number.isFinite(numericHeight)) {
    return 4
  }

  return Math.min(
    MAX_GRID_HEIGHT,
    Math.max(MIN_GRID_HEIGHT, Math.round(numericHeight))
  )
}

function getWidgetContainerStyle(gridHeight) {
  const normalizedHeight = normalizeGridHeight(gridHeight)
  const heightInPixels = normalizedHeight * GRID_HEIGHT_UNIT

  return {
    height: `${heightInPixels}px`,
    minHeight: `${heightInPixels}px`
  }
}

function getWidgetComponent(widgetType) {
  const normalizedType = String(widgetType ?? '').toUpperCase()

  switch (normalizedType) {
    case 'KPI':
      return KpiCard

    case 'TABLE':
    case 'DATA_GRID':
    case 'DATAGRID':
      return DataGridWidget

    case 'CHART':
    case 'CHART_BAR':
    case 'CHART_PIE':
    case 'CHART_LINE':
    case 'BAR':
    case 'PIE':
    case 'LINE':
      return ChartWidget

    default:
      return DataGridWidget
  }
}
</script>
