<script setup>
import { computed } from 'vue'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  status: { type: String, default: 'OK' },
})

/* خواندن امن widgetProps */
const widgetProps = computed(() => {
  const raw = props.widget?.widgetProps

  if (!raw) return {}
  if (typeof raw === 'object') return raw

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
})

/* پارس فرمول‌هایی مانند SUM(total_revenue)، AVG(amount)، COUNT(*) */
const parsedDisplay = computed(() => {
  const display = String(widgetProps.value.display ?? '').trim()

  if (!display) {
    return { fn: 'SUM', column: null }
  }

  const fnMatch = display.match(
    /^\s*(SUM|AVG|MIN|MAX|COUNT)\s*\(\s*([^)]*?)\s*\)\s*$/i
  )

  if (fnMatch) {
    const column = fnMatch[2].trim()

    return {
      fn: fnMatch[1].toUpperCase(),
      column: column === '*' ? null : column,
    }
  }

  // اگر فقط نام ستون نوشته شده باشد
  return {
    fn: 'SUM',
    column: display,
  }
})

/* محاسبه مقدار KPI از داده‌های دریافتی */
const computedValue = computed(() => {
  const rows = Array.isArray(props.data) ? props.data : []

  if (rows.length === 0) return null

  const parsed = parsedDisplay.value

  // COUNT(*)
  if (parsed.fn === 'COUNT' && !parsed.column) {
    return rows.length
  }

  let targetKey = parsed.column

  // پیدا کردن نام ستون بدون حساسیت به حروف بزرگ و کوچک
  if (targetKey) {
    const sampleRowKeys = Object.keys(rows[0] || {})

    const matchedKey = sampleRowKeys.find(
      (key) => key.toLowerCase() === targetKey.toLowerCase()
    )

    if (matchedKey) {
      targetKey = matchedKey
    }
  } else {
    // انتخاب اولین ستون عددی در صورت مشخص نبودن ستون
    const sampleRow = rows[0] || {}

    targetKey = Object.keys(sampleRow).find((key) => {
      const value = sampleRow[key]
      return value !== null && value !== '' && Number.isFinite(Number(value))
    })
  }

  if (!targetKey) return null

  const numbers = rows
    .map((row) => row?.[targetKey])
    .map((value) => {
      if (typeof value === 'string') {
        return Number(value.replace(/,/g, ''))
      }

      return Number(value)
    })
    .filter((value) => Number.isFinite(value))

  if (numbers.length === 0) return null

  switch (parsed.fn) {
    case 'SUM':
      return numbers.reduce((sum, value) => sum + value, 0)

    case 'AVG':
      return numbers.reduce((sum, value) => sum + value, 0) / numbers.length

    case 'MIN':
      return Math.min(...numbers)

    case 'MAX':
      return Math.max(...numbers)

    case 'COUNT':
      return numbers.length

    default:
      return numbers.reduce((sum, value) => sum + value, 0)
  }
})

/* فرمت فارسی مقدار */
const formattedValue = computed(() => {
  const value = computedValue.value

  if (value === null || value === undefined) return null

  const isInteger = Number.isInteger(value)

  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInteger ? 0 : 2,
  }).format(value)
})

/* وضعیت نمایش */
const displayState = computed(() => {
  if (props.status && props.status !== 'OK') return 'error'
  if (formattedValue.value === null) return 'empty'
  return 'ready'
})

const unit = computed(() => widgetProps.value.unit ?? 'تومان')
const accent = computed(() => widgetProps.value.color ?? 'emerald')

const accentClasses = computed(() => {
  const colors = {
    emerald: 'text-emerald-400 from-emerald-500/20 to-emerald-500/0',
    sky: 'text-sky-400 from-sky-500/20 to-sky-500/0',
    violet: 'text-violet-400 from-violet-500/20 to-violet-500/0',
    amber: 'text-amber-400 from-amber-500/20 to-amber-500/0',
    rose: 'text-rose-400 from-rose-500/20 to-rose-500/0',
  }

  return colors[accent.value] ?? colors.emerald
})

const accentTextClass = computed(() => {
  return accentClasses.value.split(' ')[0]
})
</script>

<template>
  <div
    class="glass-card relative flex h-full min-h-[180px] flex-col overflow-hidden rounded-2xl p-5"
  >
    <!-- هالهٔ رنگی پس‌زمینه -->
    <div
      class="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br blur-2xl"
      :class="accentClasses"
    ></div>

    <!-- عنوان کارت -->
    <div class="relative flex w-full items-start justify-between gap-2">
      <h3 class="text-sm font-medium text-slate-300">
        {{ widget.widgetTitle || 'بدون عنوان' }}
      </h3>

      <span class="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
        KPI
      </span>
    </div>

    <!-- بخش اصلی: مقدار دقیقاً وسط کارت قرار می‌گیرد -->
    <div class="relative flex min-h-0 flex-1 w-full items-center justify-center text-center">
      <template v-if="displayState === 'ready'">
        <div class="flex w-full items-baseline justify-center gap-1.5 text-center">
          <span
            class="text-3xl font-bold tracking-tight"
            :class="accentTextClass"
          >
            {{ formattedValue }}
          </span>

          <span
            v-if="unit"
            class="text-xs text-slate-400"
          >
            {{ unit }}
          </span>
        </div>
      </template>

      <template v-else-if="displayState === 'error'">
        <div class="text-center">
          <div class="text-sm font-medium text-rose-400">
            خطا در اجرای کوئری
          </div>

          <div class="mt-1 text-[11px] text-slate-500">
            {{ status }}
          </div>
        </div>
      </template>

      <template v-else>
        <div class="text-center">
          <div class="text-2xl font-bold text-slate-600">
            —
          </div>

          <div class="mt-1 text-[11px] text-slate-500">
            داده‌ای برای نمایش نیست
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
