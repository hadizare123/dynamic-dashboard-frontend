<script setup>
import KpiCard from './widgets/KpiCard.vue'
import ChartWidget from './widgets/ChartWidget.vue'
import DataGridWidget from './widgets/DataGridWidget.vue'

defineProps({
  widgets: { type: Array, default: () => [] }
})

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

function getColSpanClass(width) {
  return spanClasses[Number(width)] ?? spanClasses[4]
}

function getWidgetComponent(type) {
   console.log("Widget Type received:", type);
  if (type === 'KPI') return KpiCard
  if (type === 'TABLE' || type === 'GRID') return DataGridWidget
  if (type?.startsWith('CHART')) return ChartWidget
  return DataGridWidget
}
</script>

<template>
  <div class="grid grid-cols-12 gap-6">
    <div
      v-for="item in widgets"
      :key="item.widget.widgetId"
      class="col-span-12"
      :class="getColSpanClass(item.widget.gridWidth)"
    >
      <component
        :is="getWidgetComponent(item.widget.widgetType)"
        :widget="item.widget"
        :data="item.data ?? []"
        :columns="item.columns ?? []"
        :status="item.status ?? 'OK'"
      />
    </div>
  </div>
</template>
