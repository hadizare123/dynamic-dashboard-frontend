<script setup>
import { computed } from 'vue'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  status: { type: String, default: 'OK' },
})

/* ---------- خواندن widgetProps با خیال راحت ---------- */
const props_ = computed(() => {
  const raw = props.widget?.widgetProps
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
})

/* ---------- پارس فرمول: SUM(total_revenue) / AVG(x) / COUNT(*) / MAX / MIN ---------- */
const parsedDisplay = computed(() => {
  const display = String(props_.value.display ?? '').trim()
  if (!display) return { fn: 'SUM', column: null } // Fallback to SUM on first numeric column

  // الگوی عمومی برای تابع‌ها: SUM(col_name) یا COUNT(*)
  const fnMatch = display.match(/^\s*(SUM|AVG|MIN|MAX|COUNT)\s*\(\s*([^)]*?)\s*\)\s*$/i)
  if (fnMatch) {
    const col = fnMatch[2].trim()
    return {
      fn: fnMatch[1].toUpperCase(),
      column: col === '*' ? null : col,
    }
  }

  // اگر فقط اسم ستون نوشته شده باشه (بدون تابع)
  return { fn: 'SUM', column: display }
})

/* ---------- محاسبه مقدار واقعی از دادهٔ زنده ---------- */
const computedValue = computed(() => {
  console.log("KPI Widget Data & Props:", props.widget, props.data);
  const rows = Array.isArray(props.data) ? props.data : []
  if (rows.length === 0) return null

  const parsed = parsedDisplay.value

  // COUNT(*) → تعداد ردیف‌ها
  if (parsed.fn === 'COUNT' && !parsed.column) return rows.length

  // پیدا کردن کلید واقعی ستون با نادیده گرفتن Case (حروف کوچک و بزرگ)
  let targetKey = parsed.column

  if (targetKey) {
    const sampleRowKeys = Object.keys(rows[0] || {})
    const matchedKey = sampleRowKeys.find(
      (k) => k.toLowerCase() === targetKey.toLowerCase()
    )
    if (matchedKey) {
      targetKey = matchedKey
    }
  } else {
    // اگر ستون مشخص نشده بود، اولین کلیدی که مقدار عددی داره رو بردار
    const sampleRow = rows[0] || {}
    targetKey = Object.keys(sampleRow).find((k) => {
      const val = sampleRow[k]
      return !isNaN(Number(val)) && val !== null && val !== ''
    })
  }

  if (!targetKey) return null

  const numbers = rows
    .map((r) => r?.[targetKey])
    .map((v) => (typeof v === 'string' ? Number(v.replace(/,/g, '')) : Number(v)))
    .filter((v) => Number.isFinite(v))

  if (numbers.length === 0) return null

  switch (parsed.fn) {
    case 'SUM':
      return numbers.reduce((a, b) => a + b, 0)
    case 'AVG':
      return numbers.reduce((a, b) => a + b, 0) / numbers.length
    case 'MIN':
      return Math.min(...numbers)
    case 'MAX':
      return Math.max(...numbers)
    case 'COUNT':
      return numbers.length
    default:
      return numbers.reduce((a, b) => a + b, 0)
  }
})

/* ---------- فرمت‌بندی فارسی ---------- */
const formattedValue = computed(() => {
  const v = computedValue.value
  if (v === null || v === undefined) return null

  const isInt = Number.isInteger(v)
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInt ? 0 : 2,
  }).format(v)
})

/* ---------- حالت‌های نمایش ---------- */
const displayState = computed(() => {
  if (props.status && props.status !== 'OK') return 'error'
  if (formattedValue.value === null) return 'empty'
  return 'ready'
})

const unit = computed(() => props_.value.unit ?? 'تومان')
const accent = computed(() => props_.value.color ?? 'emerald')

const accentClasses = computed(() => {
  const map = {
    emerald: 'text-emerald-400 from-emerald-500/20 to-emerald-500/0',
    sky: 'text-sky-400 from-sky-500/20 to-sky-500/0',
    violet: 'text-violet-400 from-violet-500/20 to-violet-500/0',
    amber: 'text-amber-400 from-amber-500/20 to-amber-500/0',
    rose: 'text-rose-400 from-rose-500/20 to-rose-500/0',
  }
  return map[accent.value] ?? map.emerald
})
</script>

<template>
  <div class="glass-card relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5">
    <!-- هالهٔ رنگی پس‌زمینه -->
    <div
      class="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-br blur-2xl"
      :class="accentClasses"
    />

    <!-- عنوان -->
    <div class="relative flex items-start justify-between gap-2">
      <h3 class="text-sm font-medium text-slate-300">
        {{ widget.widgetTitle || 'بدون عنوان' }}
      </h3>
      <span class="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">KPI</span>
    </div>

    <!-- مقدار -->
    <div class="relative mt-3">
      <template v-if="displayState === 'ready'">
        <div class="flex items-baseline gap-1.5">
          <span class="text-3xl font-bold tracking-tight" :class="accentClasses.split(' ')[0]">
            {{ formattedValue }}
          </span>
          <span v-if="unit" class="text-xs text-slate-400">{{ unit }}</span>
        </div>
      </template>

      <template v-else-if="displayState === 'error'">
        <div class="text-sm font-medium text-rose-400">خطا در اجرای کوئری</div>
        <div class="mt-1 text-[11px] text-slate-500">{{ status }}</div>
      </template>

      <template v-else>
        <div class="text-2xl font-bold text-slate-600">—</div>
        <div class="mt-1 text-[11px] text-slate-500">
          داده‌ای برای نمایش نیست
        </div>
      </template>
    </div>
  </div>
</template>
