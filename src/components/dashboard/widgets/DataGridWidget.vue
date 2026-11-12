<script setup>
import { computed } from 'vue'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Array, default: () => [] }
})

const title = computed(() => props.widget.widgetTitle || 'جدول داده‌ها')

const columns = computed(() => {
  if (!props.data || props.data.length === 0) return []
  return Object.keys(props.data[0])
})

const formatHeader = (col) => {
  const map = {
    product_category: 'دسته‌بندی محصول',
    total_orders: 'تعداد سفارشات',
    total_revenue: 'درآمد کل (تومان)'
  }
  return map[col] || col
}

const formatCell = (val, col) => {
  if (typeof val === 'number') {
    return new Intl.NumberFormat('fa-IR').format(val)
  }
  return val
}
</script>

<template>
  <div class="bg-[#292531] border border-gray-800 rounded-2xl p-6 shadow-xl" dir="rtl">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-base font-bold text-white">{{ title }}</h3>
      <span class="text-xs text-gray-500">{{ data.length }} ردیف</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-right text-sm">
        <thead>
          <tr class="border-b border-gray-800 text-gray-400 text-xs">
            <th v-for="col in columns" :key="col" class="pb-3 px-3 font-medium">
              {{ formatHeader(col) }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800/60">
          <tr v-for="(row, idx) in data" :key="idx" class="hover:bg-gray-800/30 transition">
            <td v-for="col in columns" :key="col" class="py-3 px-3 text-gray-200">
              {{ formatCell(row[col], col) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
