<script setup>
import { computed, onMounted, ref } from 'vue'

const catalog = ref([]), designs = ref([]), tiles = ref([]), original = ref([])
const dashboard = ref(null), title = ref(''), selected = ref(null)
const error = ref(''), message = ref(''), busy = ref(true), extraRows = ref(0)
const start = ref(null), end = ref(null)
const pool = computed(() => catalog.value.filter(widget =>
  (widget.dashboardId == null || widget.dashboardId === dashboard.value) &&
  !tiles.value.some(tile => tile.id === widget.widgetId)))
const rowCount = computed(() => Math.max(8, ...tiles.value.map(tile => tile.y + tile.height + 1)) + extraRows.value)
const rectangle = computed(() => start.value && end.value ? {
  x: Math.min(start.value.x, end.value.x), y: Math.min(start.value.y, end.value.y),
  width: Math.abs(start.value.x - end.value.x) + 1, height: Math.abs(start.value.y - end.value.y) + 1
} : null)
const position = tile => ({ gridColumn: (tile.x + 1) + ' / span ' + tile.width, gridRow: (tile.y + 1) + ' / span ' + tile.height })
const name = id => catalog.value.find(widget => widget.widgetId === id)?.widgetTitle
async function request(path, options) {
  const response = await fetch('/api/admin/dashboard/' + path, options)
  const body = await response.json()
  if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'درخواست انجام نشد.')
  return body
}
function openDesign() {
  title.value = designs.value.find(item => item.dashboard_id === dashboard.value)?.title ?? ''
  tiles.value = dashboard.value == null ? [] : catalog.value.filter(widget => widget.dashboardId === dashboard.value)
    .map(widget => ({ id: widget.widgetId, x: widget.gridPosX, y: widget.gridPosY, width: widget.gridWidth, height: widget.gridHeight }))
  original.value = tiles.value.map(tile => tile.id)
  selected.value = null
  start.value = end.value = null
  extraRows.value = 0
  message.value = error.value = ''
}
async function load() {
  const [widgets, dashboards] = await Promise.all([request('widgets'), request('widgets/dashboards')])
  catalog.value = widgets
  designs.value = dashboards.filter(item => item.layout_type === 'ADVANCED')
  openDesign()
}
onMounted(async () => {
  try { await load() } catch (exception) { error.value = exception.message }
  finally { busy.value = false }
})
function cell(event) {
  const bounds = event.currentTarget.getBoundingClientRect()
  return { x: Math.min(11, Math.max(0, Math.floor((event.clientX - bounds.left) * 12 / bounds.width))),
    y: Math.min(rowCount.value - 1, Math.max(0, Math.floor((event.clientY - bounds.top) / 48))) }
}
function place(id, area) {
  if (!id || !area) return
  const conflict = tiles.value.some(tile => tile.id !== id && tile.x < area.x + area.width &&
    area.x < tile.x + tile.width && tile.y < area.y + area.height && area.y < tile.y + tile.height)
  if (conflict) { error.value = 'این محدوده با ویجت دیگری تداخل دارد.'; return }
  tiles.value = [...tiles.value.filter(tile => tile.id !== id), { id, ...area }]
  selected.value = null
  message.value = error.value = ''
}
function begin(event) {
  if (event.button !== 0 || !selected.value || busy.value) return
  event.currentTarget.setPointerCapture(event.pointerId)
  start.value = end.value = cell(event)
}
function finish(event) {
  if (!start.value) return
  end.value = cell(event)
  place(selected.value, rectangle.value)
  start.value = end.value = null
}
function drop(event) {
  const widget = pool.value.find(item => String(item.widgetId) === event.dataTransfer.getData('text/plain'))
  if (!widget || busy.value) return
  const spot = cell(event)
  const width = Math.min(12, Math.max(1, widget.gridWidth || 4))
  place(widget.widgetId, { ...spot, x: Math.min(spot.x, 12 - width), width, height: Math.max(1, widget.gridHeight || 3) })
}
async function save() {
  if (busy.value || !title.value.trim()) return
  busy.value = true
  message.value = error.value = ''
  try {
    const result = await request('design', { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({dashboard_id:dashboard.value, title:title.value, tiles:tiles.value, original_ids:original.value}) })
    dashboard.value = result.dashboardId
    await load()
    message.value = 'چیدمان ذخیره شد.'
  } catch (exception) { error.value = exception.message } finally { busy.value = false }
}
</script>

<template>
  <main dir="rtl" class="min-w-0 flex-1 p-5 text-gray-100 space-y-4">
    <h1 class="text-xl font-bold">طراحی پیشرفته</h1>
    <fieldset :disabled="busy" class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <label>طرح <select v-model="dashboard" @change="openDesign"><option :value="null">داشبورد جدید</option><option v-for="item in designs" :key="item.dashboard_id" :value="item.dashboard_id">{{ item.title }}</option></select></label>
        <label>عنوان <input v-model="title" maxlength="100" placeholder="نام داشبورد" /></label>
        <button :disabled="!title.trim()" @click="save">ذخیرهٔ چیدمان</button>
        <router-link v-if="dashboard" :to="'/dashboard/' + dashboard">نمایش داشبورد</router-link>
      </div>
      <p>یک ویجت را انتخاب کنید و روی شبکه از یک گوشه تا گوشهٔ دیگر بکشید؛ یا ویجت را مستقیماً روی شبکه رها کنید.</p>
      <div class="flex flex-wrap items-center gap-2">
        <strong>ویجت‌های آزاد</strong>
        <button v-for="widget in pool" :key="widget.widgetId" draggable="true" :aria-pressed="selected === widget.widgetId"
          @click="selected = widget.widgetId" @dragstart="$event.dataTransfer.setData('text/plain', String(widget.widgetId))">{{ widget.widgetTitle }}</button>
        <router-link v-if="!pool.length" to="/admin/widget-settings">ساخت ویجت بدون داشبورد</router-link>
      </div>
      <div class="board" dir="ltr" :style="{gridTemplateRows:'repeat(' + rowCount + ', 48px)'}"
        @pointerdown="begin" @pointermove="start && (end = cell($event))" @pointerup="finish" @pointercancel="start = end = null"
        @dragover.prevent @drop.prevent="drop">
        <article v-for="tile in tiles" :key="tile.id" :style="position(tile)" dir="rtl" class="tile">
          <strong>{{ name(tile.id) }}</strong>
          <button @pointerdown.stop @click="selected = tile.id">تغییر محدوده</button>
          <button @pointerdown.stop @click="tiles = tiles.filter(item => item.id !== tile.id); selected = null">حذف از داشبورد</button>
        </article>
        <div v-if="rectangle" class="preview" :style="position(rectangle)"></div>
      </div>
      <button @click="extraRows += 4">افزودن ردیف به بوم</button>
    </fieldset>
    <p role="alert" class="text-rose-300">{{ error }}</p><p role="status">{{ message }}</p>
  </main>
</template>

<style scoped>
button, select, input { background:#302d39; border:1px solid #615b70; border-radius:.5rem; padding:.35rem .65rem }
button[aria-pressed=true], button:hover { border-color:#60a5fa }
button:disabled { opacity:.5 }
.board { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); position:relative; touch-action:none; user-select:none;
  background-color:#211e29; background-image:linear-gradient(to right,#575163 1px,transparent 1px),linear-gradient(to bottom,#575163 1px,transparent 1px),conic-gradient(#ffffff07 25%,transparent 0 50%,#ffffff07 0 75%,transparent 0);
  background-size:calc(100% / 12) 48px,100% 48px,calc(100% / 6) 96px; outline:1px solid #575163 }
.tile,.preview { min-width:0; margin:2px; border-radius:.4rem; padding:.3rem; border:1px solid #5a81af; background:#26384c; overflow:auto }
.tile button { margin-inline:.25rem; font-size:.75rem }
.preview { pointer-events:none; z-index:1; background:#60a5fa55; border-color:#93c5fd }
</style>
