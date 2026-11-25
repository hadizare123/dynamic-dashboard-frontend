<script setup>
import { kpiColor } from '../components/dashboard/widgets/kpiColor.js'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const API = '/api/admin/dashboard/widgets'
const dashboards = ref([])
const queries = ref([])
const widgets = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const delete_dialog = ref(null)
const pending_delete = ref(null)
const delete_error = ref('')
const error = ref('')
const message = ref('')
const is_form_open = ref(true)
const editing_id = ref(null)
const is_editing = computed(() => editing_id.value !== null)
const selectable_queries = computed(() => queries.value.filter(query => query.is_active !== false || query.query_id === form.queryId))
const grid_fields = [
  { key: 'gridPosX', label: 'موقعیت X', min: 0, max: 11 },
  { key: 'gridPosY', label: 'موقعیت Y', min: 0 },
  { key: 'gridWidth', label: 'عرض', min: 1, max: 12 },
  { key: 'gridHeight', label: 'ارتفاع', min: 1 }
]
const empty_form = () => ({
  dashboardId: null, queryId: null, widgetTitle: '', widgetType: 'TABLE',
  gridPosX: 0, gridPosY: 0, gridWidth: 6, gridHeight: 4,
  widgetProps: {}, sortOrder: 0, isVisible: true
})
const form = reactive(empty_form())
const presentation = reactive({})
function loadPresentation(settings = {}) {
  const display = String(settings.display ?? '')
  const match = display.match(/^\s*(SUM|AVG|MIN|MAX|COUNT)\s*\((.*?)\)\s*$/i)
  Object.assign(presentation, {
    label: settings.labels ?? settings.x ?? '', value: settings.data ?? settings.y ?? '',
    operation: match?.[1].toUpperCase() ?? 'SUM', column: match ? (match[2].trim() === '*' ? '' : match[2].trim()) : display,
    unit: settings.unit ?? 'تومان', color: kpiColor(settings.color)
  })
}
loadPresentation()
const isGrid = computed(() => ['TABLE', 'GRID', 'DATAGRID', 'DATA_GRID'].includes(form.widgetType))
const columnRows = ref([])
const columnsLoading = ref(false)
const columnsError = ref('')
const retryColumns = ref(0)
watch([() => form.queryId, isGrid, editing_id, retryColumns], async ([id, grid, widgetId], _, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  columnRows.value = []
  columnsError.value = ''
  columnsLoading.value = Boolean(id)
  if (!id) return
  const widget = widgets.value.find(item => item.widgetId === widgetId && item.queryId === id)
  const titles = widget?.columnTitles ?? {}
  try {
    const keys = await check_response(await fetch('/api/admin/dashboard/queries/' + id + '/columns', { signal: controller.signal }))
    if (controller.signal.aborted) return
    for (const field of ['label', 'value', 'column']) {
      if (!keys.includes(presentation[field])) presentation[field] = ''
    }
    columnRows.value = keys.map(key => ({
      key, title: Object.hasOwn(titles, key) ? titles[key] : key
    }))
  } catch (exception) {
    if (!controller.signal.aborted) columnsError.value = exception.message
  } finally {
    if (!controller.signal.aborted) columnsLoading.value = false
  }
})

async function check_response(response) {
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch { body = null }
  if (!response.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : 'خطای HTTP ' + response.status
    throw new Error(detail)
  }
  if (text && body === null) throw new Error('پاسخ نامعتبر از سرور')
  return body
}

async function load_data() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const results = await Promise.all([
      API + '/dashboards', '/api/admin/dashboard/queries', API
    ].map(async url => {
      const data = await check_response(await fetch(url, { credentials: 'same-origin' }))
      if (!Array.isArray(data)) throw new Error('فهرست دریافتی از سرور معتبر نیست.')
      return data
    }))
    ;[dashboards.value, queries.value, widgets.value] = results
  } catch (exception) {
    error.value = 'بارگذاری تنظیمات ناموفق بود: ' + exception.message
  } finally { loading.value = false }
}

function toggle_form() { is_form_open.value = !is_form_open.value }
function reset_form() {
  editing_id.value = null
  Object.assign(form, empty_form())
  loadPresentation()
}
function start_edit(widget) {
  if (loading.value || saving.value || deleting.value) return
  editing_id.value = widget.widgetId
  const defaults = empty_form()
  for (const key of Object.keys(defaults)) form[key] = widget[key] ?? defaults[key]
  form.widgetProps = typeof widget.widgetProps === 'string' ? JSON.parse(widget.widgetProps || '{}') : { ...widget.widgetProps }
  loadPresentation(form.widgetProps)
  error.value = ''
  message.value = ''
  is_form_open.value = true
}
function cancel_edit() {
  if (saving.value || deleting.value) return
  reset_form()
  error.value = ''
  message.value = ''
}

async function save_widget() {
  if (columnsLoading.value || columnsError.value) return
  if (loading.value || saving.value || deleting.value) return
  error.value = ''
  message.value = ''
  const props = { ...form.widgetProps }
  if (form.widgetType.startsWith('CHART')) {
    if (![presentation.label, presentation.value].every(key => columnRows.value.some(column => column.key === key))) {
      error.value = 'ستون برچسب و ستون مقدار نمودار را انتخاب کنید.'
      return
    }
    delete props.labels
    delete props.data
    Object.assign(props, { x: presentation.label, y: presentation.value,
      chartType: { CHART_PIE: 'doughnut', CHART_LINE: 'line', CHART_BAR: 'bar' }[form.widgetType] })
  } else if (form.widgetType === 'KPI') {
    Object.assign(props, { unit: presentation.unit, color: presentation.color,
      display: presentation.operation + '(' + (presentation.column || '*') + ')' })
  }
  if (!form.widgetTitle.trim() || !form.queryId) {
    error.value = 'عنوان ویجت و کوئری منبع را وارد کنید.'
    return
  }
  if (grid_fields.some(field => !Number.isInteger(form[field.key]) || form[field.key] < field.min || (field.max !== undefined && form[field.key] > field.max)) || !Number.isInteger(form.sortOrder) || form.gridPosX + form.gridWidth > 12) {
    error.value = 'مقادیر چیدمان باید عدد صحیح باشند و موقعیت و عرض ویجت در محدودهٔ ۱۲ ستون قرار بگیرند.'
    return
  }
  saving.value = true
  const is_update = is_editing.value
  try {
    await check_response(await fetch(is_update ? API + '/' + editing_id.value : API, {
      method: is_update ? 'PUT' : 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, widgetTitle: form.widgetTitle.trim(), widgetProps: props,
        columnTitles: isGrid.value ? Object.fromEntries(columnRows.value.map(({ key, title }) => [key, title.trim() || key])) : {} })
    }))
    reset_form()
    message.value = is_update ? 'ویجت با موفقیت ویرایش شد.' : 'ویجت با موفقیت ثبت شد.'
    await load_data()
  } catch (exception) {
    error.value = 'ذخیره ویجت ناموفق بود: ' + exception.message
  } finally { saving.value = false }
}

function open_delete_dialog(widget) {
  if (loading.value || saving.value || deleting.value || !widget) return
  pending_delete.value = { widgetId: widget.widgetId, widgetTitle: widget.widgetTitle }
  delete_error.value = ''
  delete_dialog.value.showModal()
}
function open_form_delete() {
  open_delete_dialog(widgets.value.find(widget => widget.widgetId === editing_id.value))
}
function close_delete_dialog() {
  if (deleting.value) return
  delete_dialog.value.close()
  pending_delete.value = null
  delete_error.value = ''
}
function on_delete_backdrop(event) {
  if (event.target === delete_dialog.value) close_delete_dialog()
}
async function confirm_delete_widget() {
  if (saving.value || deleting.value || !pending_delete.value) return
  const id = pending_delete.value.widgetId
  deleting.value = true
  delete_error.value = ''
  error.value = ''
  message.value = ''
  try {
    await check_response(await fetch(API + '/' + id, { method: 'DELETE', credentials: 'same-origin' }))
    widgets.value = widgets.value.filter(widget => widget.widgetId !== id)
    if (editing_id.value === id) reset_form()
    message.value = 'ویجت با موفقیت حذف شد.'
    deleting.value = false
    close_delete_dialog()
  } catch (exception) { delete_error.value = exception.message }
  finally { deleting.value = false }
}
onMounted(load_data)
</script>

<template>
  <main dir="rtl" class="min-h-screen bg-[#17151C] px-4 py-8 text-gray-100">
    <div class="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 class="text-2xl font-black tracking-tight text-white">
          تنظیمات ویجت
        </h1>
        <p class="mt-2 text-sm text-gray-400">
          ساخت و مدیریت ویجت‌های داشبورد
        </p>
      </header>

      <p
        v-if="error"
        role="alert"
        class="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-medium text-red-200"
      >
        {{ error }}
      </p>

      <p
        v-if="message"
        class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200"
      >
        {{ message }}
      </p>

      <!-- پنل فرم جمع‌شونده -->
      <section class="rounded-2xl border border-white/15 bg-[#211e28]/95 shadow-2xl shadow-black/20">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-5 py-4 text-right sm:px-8"
          :aria-expanded="is_form_open" aria-controls="widget-form-panel" @click="toggle_form"
        >
          <span class="flex items-center gap-3">
            <span
              class="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"
            >
              <svg
                class="h-5 w-5 transition-transform duration-200"
                :class="is_form_open ? 'rotate-180' : ''"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            <span>
              <span class="block text-lg font-bold text-white">
                {{ is_editing ? `ویرایش ویجت #${editing_id}` : 'ثبت ویجت جدید' }}
              </span>
              <span class="mt-0.5 block text-sm text-gray-400">
                {{ is_form_open ? 'برای بستن کلیک کنید' : 'برای باز کردن کلیک کنید' }}
              </span>
            </span>
          </span>
        </button>

        <div id="widget-form-panel" v-show="is_form_open" class="border-t border-white/10 px-5 pb-6 pt-5 sm:px-8">
          <form @submit.prevent="save_widget">
            <fieldset :disabled="loading || saving || deleting" class="space-y-6">
            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">عنوان ویجت <span class="text-rose-400">*</span></span>
              <input v-model.trim="form.widgetTitle" required maxlength="150" placeholder="مثلاً: فروش ماهانه" class="form-control" />
            </label>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label class="block space-y-2">
                <span class="block text-sm font-semibold text-gray-100">داشبورد (اختیاری)</span>
                <select v-model="form.dashboardId" class="form-control">
                  <option :value="null">بدون داشبورد</option>
                  <option v-for="dashboard in dashboards" :key="dashboard.dashboard_id" :value="dashboard.dashboard_id">{{ dashboard.title }}</option>
                </select>
              </label>
              <label class="block space-y-2">
                <span class="block text-sm font-semibold text-gray-100">کوئری منبع <span class="text-rose-400">*</span></span>
                <select v-model="form.queryId" required class="form-control">
                  <option :value="null" disabled>انتخاب کوئری...</option>
                  <option v-for="query in selectable_queries" :key="query.query_id" :value="query.query_id">{{ query.report_title }}{{ query.is_active === false ? ' (غیرفعال)' : '' }}</option>
                </select>
              </label>
              <label class="block space-y-2">
                <span class="block text-sm font-semibold text-gray-100">نوع نمایش</span>
                <select v-model="form.widgetType" class="form-control">
                  <option value="TABLE">جدول</option>
                  <option value="KPI">کارت آماری</option>
                  <option value="CHART_BAR">نمودار میله‌ای</option>
                  <option value="CHART_LINE">نمودار خطی</option>
                  <option value="CHART_PIE">نمودار دایره‌ای</option>
                </select>
              </label>
              <label class="block space-y-2">
                <span class="block text-sm font-semibold text-gray-100">ترتیب نمایش</span>
                <input v-model.number="form.sortOrder" type="number" required step="1" class="form-control" />
              </label>
            </div>
            <fieldset v-if="form.queryId" class="space-y-3">
              <legend>{{ isGrid ? 'عنوان ستون‌های جدول' : 'تنظیمات نمایشی' }}</legend>
              <p v-if="columnsLoading">در حال خواندن ستون‌ها…</p>
              <p v-else-if="columnsError" role="alert">{{ columnsError }}
                <button type="button" @click="retryColumns++">تلاش دوباره</button>
              </p>
              <template v-if="isGrid"><label v-for="column in columnRows" :key="column.key" class="flex items-center gap-3">
                <span dir="auto">{{ column.key }}</span>
                <input v-model="column.title" class="form-control" :placeholder="column.key" />
              </label></template>
              <template v-else-if="form.widgetType.startsWith('CHART')">
                <label v-for="field in ['label', 'value']" :key="field" class="block">
                  {{ field === 'label' ? 'برچسب هر دسته' : 'مقدار عددی هر دسته' }}
                  <select v-model="presentation[field]" class="form-control" required>
                    <option disabled value="">انتخاب ستون…</option>
                    <option v-for="column in columnRows" :key="column.key" :value="column.key">{{ column.title }}</option>
                  </select>
                </label>
              </template>
              <template v-else-if="form.widgetType === 'KPI'">
                <label class="block">روش محاسبه<select v-model="presentation.operation" class="form-control">
                  <option v-for="(label, key) in { SUM:'مجموع', AVG:'میانگین', MIN:'کمترین', MAX:'بیشترین', COUNT:'تعداد' }" :key="key" :value="key">{{ label }}</option>
                </select></label>
                <label class="block">ستون محاسبه<select v-model="presentation.column" class="form-control">
                  <option value="">{{ presentation.operation === 'COUNT' ? 'همهٔ ردیف‌ها' : 'اولین ستون عددی' }}</option>
                  <option v-for="column in columnRows" :key="column.key" :value="column.key">{{ column.title }}</option>
                </select></label>
                <label class="block">واحد نمایش<input v-model="presentation.unit" class="form-control" placeholder="مثلاً تومان یا نفر" /></label>
                <label class="flex items-center gap-3">رنگ کارت
                  <input v-model="presentation.color" type="color" class="h-10 w-16 cursor-pointer rounded" />
                </label>
              </template>
            </fieldset>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
              <label v-for="field in grid_fields" :key="field.key" class="block space-y-2">
                <span class="block text-sm font-semibold text-gray-100">{{ field.label }}</span>
                <input v-model.number="form[field.key]" type="number" required step="1" :min="field.min" :max="field.max" class="form-control" />
              </label>
            </div>
            <label class="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/[0.07]">
              <input v-model="form.isVisible" type="checkbox" class="h-4 w-4 accent-emerald-500" />
              ویجت فعال و نمایان باشد
            </label>

            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                :disabled="loading || saving || deleting"
                class="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving ? 'در حال ذخیره...' : is_editing ? 'ذخیره تغییرات' : 'ثبت ویجت' }}
              </button>

              <button
                v-if="is_editing"
                type="button"
                class="rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/[0.08]"
                @click="cancel_edit"
                :disabled="loading || saving || deleting"
              >
                لغو ویرایش
              </button>
              <button
                v-if="is_editing"
                type="button"
                :disabled="loading || saving || deleting"
                @click="open_form_delete"
                class="rounded-xl border border-rose-400/30 bg-rose-500/10 px-6 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                حذف ویجت
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      </section>

      <!-- لیست ویجت‌ها -->
      <section class="rounded-2xl border border-white/15 bg-[#211e28]/95 p-5 shadow-xl shadow-black/15 sm:p-8">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-lg font-bold text-white">ویجت‌های ثبت‌شده</h2>
          <button type="button" :disabled="loading || saving || deleting" @click="load_data" class="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/5 disabled:opacity-50">بارگذاری مجدد</button>
        </div>

        <p v-if="loading" class="text-sm text-gray-300">در حال بارگذاری...</p>

        <p
          v-else-if="!widgets.length"
          class="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400"
        >
          هنوز ویجت ثبت نشده است.
        </p>

        <ul v-else class="divide-y divide-white/10">
          <li
            v-for="widget in widgets"
            :key="widget.widgetId"
            class="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div>
              <p class="font-semibold text-gray-100">{{ widget.widgetTitle }}</p>
              <p class="mt-1 text-sm text-gray-400">
                #{{ widget.widgetId }} · {{ widget.widgetType }} ·
                {{ widget.isVisible ? 'فعال' : 'غیرفعال' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
              @click="start_edit(widget)"
              :disabled="loading || saving || deleting"
            >
              ویرایش
            </button>
            <button
              type="button"
              :disabled="loading || saving || deleting"
              @click="open_delete_dialog(widget)"
              :aria-label="`حذف ویجت ${widget.widgetTitle}`"
              class="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >حذف</button>
            </div>
          </li>
        </ul>
      </section>
    </div>
    <dialog
      ref="delete_dialog"
      class="delete-dialog"
      dir="rtl"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      :aria-busy="deleting"
      @cancel.prevent="close_delete_dialog"
      @click="on_delete_backdrop"
    >
      <div class="rounded-3xl border border-white/10 bg-[#211e28] p-6 text-right text-slate-100 shadow-2xl sm:p-8">
        <div class="mb-5 flex items-start justify-between gap-4">
          <span class="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-400">
            <svg aria-hidden="true" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7M14 10v7" />
            </svg>
          </span>
          <button type="button" aria-label="بستن" :disabled="deleting" @click="close_delete_dialog" class="modal-close rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40">
            <svg aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <h2 id="delete-dialog-title" class="text-xl font-bold tracking-tight">حذف ویجت</h2>
        <p id="delete-dialog-description" class="mt-3 text-sm leading-7 text-slate-400">
          آیا از حذف ویجت زیر مطمئن هستید؟ این ویجت حذف می‌شود و امکان بازگردانی وجود ندارد.
        </p>
        <div class="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p class="break-words text-sm font-semibold text-slate-100">{{ pending_delete?.widgetTitle }}</p>
          <p class="mt-1 break-all text-xs text-slate-500">#{{ pending_delete?.widgetId }}</p>
        </div>
        <p v-if="delete_error" role="alert" class="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-300">{{ delete_error }}</p>
        <div class="mt-7 flex gap-3 border-t border-white/10 pt-5">
          <button type="button" autofocus :disabled="deleting" @click="close_delete_dialog" class="modal-action flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">انصراف</button>
          <button type="button" :disabled="deleting" @click="confirm_delete_widget" class="modal-action flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60">
            <svg v-if="deleting" aria-hidden="true" class="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" /><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
            {{ deleting ? 'در حال حذف...' : 'حذف ویجت' }}
          </button>
        </div>
      </div>
    </dialog>
  </main>
</template>

<style scoped>
.delete-dialog {
  width: min(28rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: 1.5rem;
  background: transparent;
  color-scheme: dark;
}

.delete-dialog::backdrop {
  background: rgba(9, 8, 13, 0.75);
  backdrop-filter: blur(6px);
}

.delete-dialog[open] {
  animation: modal-appear 180ms ease-out;
}

.modal-action:focus-visible,
.modal-close:focus-visible {
  outline: 2px solid #fda4af;
  outline-offset: 3px;
}

@keyframes modal-appear {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .delete-dialog[open] { animation: none; }
}


.form-control {
  display: block;
  width: 100%;
  min-height: 48px;
  border: 1px solid rgba(209, 213, 219, 0.28);
  border-radius: 0.8rem;
  background: #302c38;
  padding: 0.8rem 1rem;
  color: #f9fafb;
  font-size: 0.9rem;
  line-height: 1.6;
  outline: none;
  transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}
.form-control::placeholder { color: #a8a2b2; }
.form-control:hover { border-color: rgba(209, 213, 219, 0.45); background: #35313e; }
.form-control:focus {
  border-color: #60a5fa;
  background: #35313e;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}
select.form-control { color-scheme: dark; }
textarea.form-control { min-height: 88px; }
@media (prefers-reduced-motion: reduce) { .form-control { transition: none; } }
</style>
