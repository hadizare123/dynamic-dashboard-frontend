<script setup>
import { computed, ref, watch } from 'vue'
import { gridFile } from './gridExport.js'

const props = defineProps({
  widget: { type: Object, required: true },
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] }
})

const title = computed(() => props.widget.widgetTitle || 'جدول داده‌ها')

const columns = computed(() => {
  return props.columns.length ? props.columns : Object.keys(props.data[0] ?? {})
})

const formatHeader = (col) => {
  const titles = props.widget.columnTitles ?? {}
  return Object.hasOwn(titles, col) && titles[col] ? titles[col] : col
}

const numbers = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 12 })
const formatCell = value => typeof value === 'number' ? numbers.format(value) : value
const normalize = value => String(value ?? '').toLocaleLowerCase('fa').replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776)).replaceAll('ي', 'ی').replaceAll('ك', 'ک')
const search = ref('')
const exportOpen = ref(false)
const exportButton = ref(null)
function closeExport() {
  exportOpen.value = false
  exportButton.value?.focus()
}
const sortKey = ref(null)
const direction = ref(1)
const page = ref(1)
const pageSize = 100
const collator = new Intl.Collator('fa', { numeric: true })
const filtered = computed(() => {
  const needle = normalize(search.value.trim())
  return needle ? props.data.filter(row => columns.value.some(key =>
    normalize(row[key]).includes(needle) || normalize(formatCell(row[key])).includes(needle))) : props.data
})
const sorted = computed(() => {
  const key = sortKey.value
  if (!columns.value.includes(key)) return filtered.value
  return [...filtered.value].sort((left, right) => {
    const first = left[key], second = right[key]
    if (first == null || second == null) return Number(first == null) - Number(second == null)
    return direction.value * (typeof first === 'number' && typeof second === 'number' ? first - second : collator.compare(first, second))
  })
})
const pages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize)))
watch(search, () => { page.value = 1 })
watch(pages, count => { page.value = Math.min(page.value, count) })
const visibleRows = computed(() => sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const numeric = computed(() => columns.value.filter(key => props.data.some(row => Number.isFinite(row[key])) && props.data.every(row => row[key] == null || Number.isFinite(row[key]))))
const totals = computed(() => Object.fromEntries(numeric.value.map(key => [key, filtered.value.reduce((sum, row) => sum + (row[key] ?? 0), 0)])))
function sortBy(key) {
  direction.value = sortKey.value === key ? -direction.value : 1
  sortKey.value = key
  page.value = 1
}
function download(format) {
  const keys = columns.value
  const rows = [keys.map(formatHeader), ...sorted.value.map(row => keys.map(key => row[key]))]
  if (numeric.value.length) rows.push(keys.map((key, index) => totals.value[key] ?? (index === 0 ? 'جمع' : '')))
  const link = document.createElement('a')
  link.href = URL.createObjectURL(gridFile(rows, format))
  link.download = title.value + '.' + format
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
</script>

<template>
  <div class="bg-[#292531] border border-gray-800 rounded-2xl p-5 shadow-xl h-full flex flex-col overflow-hidden" dir="rtl">
    <!-- هدر ویجت با یک خط جداکننده و پدیده فاصله مناسب -->
    <div class="flex flex-wrap gap-2 items-center pb-2 border-b border-gray-800/80 shrink-0">
      <h3 class="text-base font-bold text-white">{{ title }}</h3>
      <label class="flex min-w-0 basis-40 grow items-center gap-2 rounded-lg border border-slate-400 bg-slate-900 px-3 py-2 text-slate-200 focus-within:ring-2 focus-within:ring-sky-400">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>
        <input v-model="search" type="search" aria-label="جستجو در جدول" placeholder="جستجو در جدول…" class="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-300" />
      </label>
      <div class="relative" @keydown.esc.stop="closeExport" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (exportOpen = false)">
        <button ref="exportButton" type="button" :disabled="!columns.length" :aria-expanded="exportOpen"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-3 py-2 text-xs text-white hover:bg-slate-700 disabled:opacity-40"
          @click="exportOpen = !exportOpen">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          <span class="sr-only">دریافت فایل جدول</span>
        </button>
        <div v-if="exportOpen" class="absolute end-0 top-full z-20 mt-1 w-36 rounded-lg border border-slate-600 bg-slate-900 p-1 text-sm text-white shadow-lg">
          <button v-for="format in ['csv', 'xml']" :key="format" type="button" class="block w-full rounded px-3 py-2 text-right hover:bg-slate-700 focus:bg-slate-700"
            @click="download(format); closeExport()">{{ format === 'csv' ? 'دانلود CSV' : 'دانلود اکسل' }}</button>
        </div>
      </div>
    </div>

    <!-- بدنه جدول با اسکرول عمودی و افقی (دارای کلاس سفارشی custom-scrollbar) -->
    <div class="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-xl border border-gray-700/60 bg-[#211e28]">
      <table class="data-table h-full w-full flex flex-col text-right text-sm" :style="{ minWidth: columns.length * 7 + 'rem', '--column-count': columns.length || 1 }">
        <thead class="shrink-0 overflow-hidden custom-scrollbar bg-[#34303d]">
          <tr class="border-b border-gray-800 text-gray-400 text-xs">
            <th v-for="col in columns" :key="col" scope="col" :aria-sort="sortKey === col ? (direction === 1 ? 'ascending' : 'descending') : 'none'" class="border-b border-gray-700 px-3 py-2 font-medium">
              <button type="button" @click="sortBy(col)">{{ formatHeader(col) }} <span aria-hidden="true">{{ sortKey === col ? (direction === 1 ? '↑' : '↓') : '↕' }}</span></button>
            </th>
          </tr>
        </thead>
        <tbody class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-gray-800/60">
          <tr v-if="!visibleRows.length"><td style="grid-column: 1 / -1" class="p-2">ردیفی یافت نشد.</td></tr>
          <tr v-for="(row, idx) in visibleRows" :key="idx" class="hover:bg-gray-800/30 transition">
            <td v-for="col in columns" :key="col" class="py-3 px-3 text-gray-200">
              {{ formatCell(row[col], col) }}
            </td>
          </tr>
        </tbody>
        <tfoot v-if="numeric.length" class="shrink-0 overflow-hidden custom-scrollbar bg-[#34303d]">
          <tr><td v-for="(col, index) in columns" :key="col" class="px-3 py-1 font-bold">
            <span v-if="index === 0">جمع </span>{{ Object.hasOwn(totals, col) ? formatCell(totals[col]) : '' }}
          </td></tr>
        </tfoot>
      </table>
    </div>
    <nav aria-label="صفحه‌بندی جدول" class="flex flex-wrap items-center gap-2 pt-1 text-xs">
      <span>{{ numbers.format(filtered.length) }} ردیف</span>
      <button type="button" :disabled="page <= 1" class="disabled:opacity-40" @click="page--">قبلی</button>
      <span>{{ numbers.format(page) }} از {{ numbers.format(pages) }}</span>
      <button type="button" :disabled="page >= pages" class="disabled:opacity-40" @click="page++">بعدی</button>
    </nav>
  </div>
</template>

<style scoped>
.data-table tr {
  display: grid;
  grid-template-columns: repeat(var(--column-count), minmax(0, 1fr));
  overflow-wrap: anywhere;
}
.data-table thead,
.data-table tbody,
.data-table tfoot {
  scrollbar-gutter: stable;
}
</style>
