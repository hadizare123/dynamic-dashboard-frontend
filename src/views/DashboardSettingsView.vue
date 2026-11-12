<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const sources = ref([])
const queries = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')

// ✅ وضعیت باز/بسته بودن پنل فرم
const isFormOpen = ref(true)

// ✅ شناسه کوئری در حال ویرایش (null = حالت ثبت جدید)
const editingId = ref(null)
const isEditing = computed(() => editingId.value !== null)

const emptyForm = () => ({
  sourceId: null,
  reportTitle: '',
  description: '',
  sqlText: '',
  chartType: 'TABLE',
  isActive: true
})

const form = reactive(emptyForm())

async function check(response) {
  if (!response.ok) {
    if (response.status === 403) throw new Error('دسترسی غیرمجاز (خطای امنیتی یا CSRF)')
    const errText = await response.text().catch(() => '')
    throw new Error(`خطای HTTP ${response.status}${errText ? ' - ' + errText : ''}`)
  }
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [sourcesResponse, queriesResponse] = await Promise.all([
      fetch('/api/admin/dashboard/queries/sources', { credentials: 'same-origin' }),
      fetch('/api/admin/dashboard/queries', { credentials: 'same-origin' })
    ])

    sources.value = await check(sourcesResponse)
    queries.value = await check(queriesResponse)
  } catch (e) {
    error.value = `بارگذاری تنظیمات ناموفق بود: ${e.message}`
  } finally {
    loading.value = false
  }
}

// ✅ باز/بسته کردن پنل فرم
function toggleForm() {
  isFormOpen.value = !isFormOpen.value
}

// ✅ شروع ویرایش یک کوئری
function startEdit(query) {
  editingId.value = query.queryId
  form.sourceId = query.sourceId ?? null
  form.reportTitle = query.reportTitle ?? ''
  form.description = query.description ?? ''
  form.sqlText = query.sqlText ?? ''
  form.chartType = query.chartType ?? 'TABLE'
  form.isActive = query.isActive ?? true

  error.value = ''
  message.value = ''
  isFormOpen.value = true   // پنل را باز کن
}

// ✅ لغو ویرایش و بازگشت به حالت ثبت جدید
function cancelEdit() {
  editingId.value = null
  Object.assign(form, emptyForm())
  error.value = ''
  message.value = ''
}

async function save() {
  error.value = ''
  message.value = ''

  // ✅ اعتبارسنجی فارسی فیلدهای اجباری
  if (!form.reportTitle || !form.reportTitle.trim()) {
    error.value = 'لطفاً عنوان گزارش را وارد کنید.'
    return
  }
  if (!form.sourceId) {
    error.value = 'لطفاً منبع داده را انتخاب کنید.'
    return
  }
  if (!form.sqlText || !form.sqlText.trim()) {
    error.value = 'لطفاً متن SQL را وارد کنید.'
    return
  }

  saving.value = true
  const isUpdate = isEditing.value

  try {
    const url = isUpdate
      ? `http://localhost:8081/api/admin/dashboard/queries/${editingId.value}`
      : 'http://localhost:8081/api/admin/dashboard/queries'

    const response = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: form.sourceId,
        categoryId: null,
        reportTitle: form.reportTitle,
        description: form.description,
        sqlText: form.sqlText,
        chartType: form.chartType,
        isActive: form.isActive
      })
    })

    await check(response)
    editingId.value = null
    Object.assign(form, emptyForm())
    message.value = isUpdate ? 'کوئری با موفقیت ویرایش شد.' : 'کوئری با موفقیت ثبت شد.'
    await load()
  } catch (e) {
    error.value = `${isUpdate ? 'ویرایش' : 'ثبت'} کوئری ناموفق بود: ${e.message}`
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <main dir="rtl" class="min-h-screen bg-[#17151C] px-4 py-8 text-gray-100">
    <div class="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 class="text-2xl font-black tracking-tight text-white">
          تنظیمات داشبورد
        </h1>
        <p class="mt-2 text-sm text-gray-400">
          ساخت و مدیریت گزارش‌های داشبورد
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

      <!-- ✅ پنل فرم جمع‌شونده -->
      <section class="rounded-2xl border border-white/15 bg-[#211e28]/95 shadow-2xl shadow-black/20">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-5 py-4 text-right sm:px-8"
          @click="toggleForm"
        >
          <span class="flex items-center gap-3">
            <span
              class="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"
            >
              <svg
                class="h-5 w-5 transition-transform duration-200"
                :class="isFormOpen ? 'rotate-180' : ''"
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
                {{ isEditing ? `ویرایش کوئری #${editingId}` : 'ثبت کوئری جدید' }}
              </span>
              <span class="mt-0.5 block text-sm text-gray-400">
                {{ isFormOpen ? 'برای بستن کلیک کنید' : 'برای باز کردن کلیک کنید' }}
              </span>
            </span>
          </span>
        </button>

        <!-- محتوای فرم: با v-show تا مقادیر حفظ شوند -->
        <div v-show="isFormOpen" class="border-t border-white/10 px-5 pb-6 pt-5 sm:px-8">
          <form class="space-y-6" @submit.prevent="save">
            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                عنوان گزارش <span class="text-rose-400">*</span>
              </span>
              <input
                v-model.trim="form.reportTitle"
                maxlength="255"
                placeholder="مثلاً: فروش ماهانه"
                class="form-control"
              />
            </label>

            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                منبع داده <span class="text-rose-400">*</span>
              </span>
              <select v-model="form.sourceId" class="form-control">
                <option :value="null" disabled>انتخاب منبع داده...</option>
                <option
                  v-for="source in sources"
                  :key="source.sourceId"
                  :value="source.sourceId"
                >
                  {{ source.displayName }} ({{ source.sourceKey }})
                </option>
              </select>
            </label>

            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                نوع نمایش <span class="text-rose-400">*</span>
              </span>
              <select v-model="form.chartType" class="form-control">
                <option value="TABLE">جدول</option>
                <option value="CHART_BAR">نمودار میله‌ای</option>
                <option value="CHART_LINE">نمودار خطی</option>
                <option value="CHART_PIE">نمودار دایره‌ای</option>
              </select>
            </label>

            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">توضیحات</span>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="توضیح کوتاهی دربارهٔ این گزارش..."
                class="form-control resize-y"
              />
            </label>

            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                متن SQL <span class="text-rose-400">*</span>
              </span>
              <textarea
                v-model="form.sqlText"
                rows="8"
                dir="ltr"
                placeholder="SELECT ..."
                class="form-control resize-y text-left font-mono"
              />
            </label>

            <label
              class="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/[0.07]"
            >
              <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-emerald-500" />
              فعال باشد
            </label>

            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                :disabled="saving"
                class="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving ? 'در حال ذخیره...' : isEditing ? 'ذخیره تغییرات' : 'ثبت کوئری' }}
              </button>

              <button
                v-if="isEditing"
                type="button"
                class="rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/[0.08]"
                @click="cancelEdit"
              >
                لغو ویرایش
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- لیست کوئری‌ها -->
      <section class="rounded-2xl border border-white/15 bg-[#211e28]/95 p-5 shadow-xl shadow-black/15 sm:p-8">
        <h2 class="mb-4 text-lg font-bold text-white">کوئری‌های ثبت‌شده</h2>

        <p v-if="loading" class="text-sm text-gray-300">در حال بارگذاری...</p>

        <p
          v-else-if="!queries.length"
          class="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400"
        >
          هنوز کوئری ثبت نشده است.
        </p>

        <ul v-else class="divide-y divide-white/10">
          <li
            v-for="query in queries"
            :key="query.queryId"
            class="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div>
              <p class="font-semibold text-gray-100">{{ query.reportTitle }}</p>
              <p class="mt-1 text-sm text-gray-400">
                #{{ query.queryId }} · {{ query.chartType }} ·
                {{ query.isActive ? 'فعال' : 'غیرفعال' }}
              </p>
            </div>

            <button
              type="button"
              class="rounded-lg border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
              @click="startEdit(query)"
            >
              ویرایش
            </button>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<style scoped>
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
