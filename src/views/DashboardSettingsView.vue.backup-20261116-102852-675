<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const sources = ref([])
const queries = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')

const is_form_open = ref(true)
const editing_id = ref(null)
const is_editing = computed(() => editing_id.value !== null)

const empty_form = () => ({
  source_id: null,
  category_id: null,
  report_title: '',
  description: '',
  sql_text: '',
  chart_type: 'TABLE',
  is_active: true
})

const form = reactive(empty_form())

async function check_response(response) {
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('دسترسی غیرمجاز (خطای امنیتی یا CSRF)')
    }
    const error_text = await response.text().catch(() => '')
    throw new Error(
      `خطای HTTP ${response.status}${error_text ? ` - ${error_text}` : ''}`
    )
  }
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

async function load_data() {
  loading.value = true
  error.value = ''
  try {
    const [sources_response, queries_response] = await Promise.all([
      fetch('/api/admin/dashboard/queries/sources', {
        credentials: 'same-origin'
      }),
      fetch('/api/admin/dashboard/queries', {
        credentials: 'same-origin'
      })
    ])

    sources.value = await check_response(sources_response)
    queries.value = await check_response(queries_response)
  } catch (exception) {
    error.value = `بارگذاری تنظیمات ناموفق بود: ${exception.message}`
  } finally {
    loading.value = false
  }
}

function toggle_form() {
  is_form_open.value = !is_form_open.value
}

function start_edit(query) {
  editing_id.value = query.query_id
  form.source_id = query.source_id ?? null
  form.category_id = query.category_id ?? null
  form.report_title = query.report_title ?? ''
  form.description = query.description ?? ''
  form.sql_text = query.sql_text ?? ''
  form.chart_type = query.chart_type ?? 'TABLE'
  form.is_active = query.is_active ?? true

  error.value = ''
  message.value = ''
  is_form_open.value = true
}

function cancel_edit() {
  editing_id.value = null
  Object.assign(form, empty_form())
  error.value = ''
  message.value = ''
}

async function save_query() {
  error.value = ''
  message.value = ''

  if (!form.report_title || !form.report_title.trim()) {
    error.value = 'لطفاً عنوان گزارش را وارد کنید.'
    return
  }
  if (!form.source_id) {
    error.value = 'لطفاً منبع داده را انتخاب کنید.'
    return
  }
  if (!form.sql_text || !form.sql_text.trim()) {
    error.value = 'لطفاً متن SQL را وارد کنید.'
    return
  }

  saving.value = true
  const is_update = is_editing.value

  try {
    const url = is_update
      ? `/api/admin/dashboard/queries/${editing_id.value}`
      : '/api/admin/dashboard/queries'

    const response = await fetch(url, {
      method: is_update ? 'PUT' : 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_id: form.source_id,
        category_id: form.category_id,
        report_title: form.report_title,
        description: form.description,
        sql_text: form.sql_text,
        chart_type: form.chart_type,
        is_active: form.is_active
      })
    })

    await check_response(response)
    editing_id.value = null
    Object.assign(form, empty_form())
    message.value = is_update
      ? 'کوئری با موفقیت ویرایش شد.'
      : 'کوئری با موفقیت ثبت شد.'
    await load_data()
  } catch (exception) {
    error.value = `${is_update ? 'ویرایش' : 'ثبت'} کوئری ناموفق بود: ${exception.message}`
  } finally {
    saving.value = false
  }
}

onMounted(load_data)
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

      <!-- پنل فرم جمع‌شونده -->
      <section class="rounded-2xl border border-white/15 bg-[#211e28]/95 shadow-2xl shadow-black/20">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-5 py-4 text-right sm:px-8"
          @click="toggle_form"
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
                {{ is_editing ? `ویرایش کوئری #${editing_id}` : 'ثبت کوئری جدید' }}
              </span>
              <span class="mt-0.5 block text-sm text-gray-400">
                {{ is_form_open ? 'برای بستن کلیک کنید' : 'برای باز کردن کلیک کنید' }}
              </span>
            </span>
          </span>
        </button>

        <div v-show="is_form_open" class="border-t border-white/10 px-5 pb-6 pt-5 sm:px-8">
          <form class="space-y-6" @submit.prevent="save_query">
            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                عنوان گزارش <span class="text-rose-400">*</span>
              </span>
              <input
                v-model.trim="form.report_title"
                maxlength="255"
                placeholder="مثلاً: فروش ماهانه"
                class="form-control"
              />
            </label>

            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                منبع داده <span class="text-rose-400">*</span>
              </span>
              <select v-model="form.source_id" class="form-control">
                <option :value="null" disabled>انتخاب منبع داده...</option>
                <option
                  v-for="source in sources"
                  :key="source.source_id"
                  :value="source.source_id"
                >
                  {{ source.display_name }} ({{ source.source_key }})
                </option>
              </select>
            </label>

            <label class="block space-y-2">
              <span class="block text-sm font-semibold text-gray-100">
                نوع نمایش <span class="text-rose-400">*</span>
              </span>
              <select v-model="form.chart_type" class="form-control">
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
                v-model="form.sql_text"
                rows="8"
                dir="ltr"
                placeholder="SELECT ..."
                class="form-control resize-y text-left font-mono"
              />
            </label>

            <label
              class="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/[0.07]"
            >
              <input v-model="form.is_active" type="checkbox" class="h-4 w-4 accent-emerald-500" />
              فعال باشد
            </label>

            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                :disabled="saving"
                class="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving ? 'در حال ذخیره...' : is_editing ? 'ذخیره تغییرات' : 'ثبت کوئری' }}
              </button>

              <button
                v-if="is_editing"
                type="button"
                class="rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/[0.08]"
                @click="cancel_edit"
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
            :key="query.query_id"
            class="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div>
              <p class="font-semibold text-gray-100">{{ query.report_title }}</p>
              <p class="mt-1 text-sm text-gray-400">
                #{{ query.query_id }} · {{ query.chart_type }} ·
                {{ query.is_active ? 'فعال' : 'غیرفعال' }}
              </p>
            </div>

            <button
              type="button"
              class="rounded-lg border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
              @click="start_edit(query)"
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
