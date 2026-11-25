<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { fetchDashboard } from '../api/dashboardApi'
import DashboardGrid from '../components/dashboard/DashboardGrid.vue'

const route = useRoute()

const rawResponse = ref(null)
const loading = ref(true)
const refreshing = ref(false)
const errorMessage = ref('')
const lastUpdatedAt = ref(null)

let refreshTimer = null
let requestVersion = 0

/**
 * شناسه داشبورد از مسیر /dashboard/:id
 */
const dashboardId = computed(() => {
  const id = Number(route.params.id)
  return Number.isFinite(id) && id > 0 ? id : 1
})

/**
 * اطلاعات اصلی داشبورد
 */
const dashboardMeta = computed(() => {
  if (!rawResponse.value) return null
  return rawResponse.value.dashboard || rawResponse.value
})

/**
 * لیست ویجت‌ها
 */
const widgetList = computed(() => {
  if (!rawResponse.value) return []

  return Array.isArray(rawResponse.value.widgets)
    ? rawResponse.value.widgets
    : []
})

/**
 * تنظیمات تم ارسال‌شده از بک‌اند
 */
const themeConfig = computed(() => {
  const defaultTheme = {
    bg: '#17151C',
    accent: '#AAA2B3',
    card_bg: '#292531'
  }

  const config = dashboardMeta.value?.themeConfig

  if (!config) return defaultTheme

  if (typeof config === 'object') {
    return {
      ...defaultTheme,
      ...config
    }
  }

  try {
    return {
      ...defaultTheme,
      ...JSON.parse(config)
    }
  } catch (error) {
    console.warn('Dashboard themeConfig is not valid JSON:', error)
    return defaultTheme
  }
})

/**
 * متغیرهای CSS مربوط به تم
 */
const dashboardStyle = computed(() => ({
  '--dashboard-bg': themeConfig.value.bg,
  '--dashboard-accent': themeConfig.value.accent,
  '--dashboard-card-bg': themeConfig.value.card_bg
}))

/**
 * فاصله رفرش خودکار بر حسب ثانیه
 */
const refreshRate = computed(() => {
  const rate = Number(dashboardMeta.value?.refreshRateSec)
  return Number.isFinite(rate) && rate > 0 ? rate : 30
})

/**
 * زمان آخرین بروزرسانی
 */
const formattedLastUpdated = computed(() => {
  if (!lastUpdatedAt.value) return 'هنوز بروزرسانی نشده'

  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(lastUpdatedAt.value)
})

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()

  refreshTimer = window.setInterval(() => {
    if (!loading.value && !refreshing.value) {
      loadDashboard(true)
    }
  }, refreshRate.value * 1000)
}

/**
 * دریافت اطلاعات داشبورد
 */
const loadDashboard = async (isRefresh = false) => {
  const currentRequest = ++requestVersion
  const requestedDashboardId = dashboardId.value

  if (isRefresh) {
    refreshing.value = true
  } else {
    loading.value = true
  }

  errorMessage.value = ''

  try {
    const response = await fetchDashboard(requestedDashboardId)

    // نتیجه درخواست قدیمی را پس از تغییر مسیر اعمال نکن.
    if (currentRequest !== requestVersion) return

    // پشتیبانی از خروجی مستقیم و خروجی axios
    rawResponse.value = response?.data ?? response
    lastUpdatedAt.value = new Date()

    startAutoRefresh()
  } catch (error) {
    if (currentRequest !== requestVersion) return

    console.error('Dashboard loading error:', error)

    errorMessage.value =
      error?.response?.data?.message ||
      'خطا در دریافت اطلاعات داشبورد. وضعیت سرویس Spring Boot را بررسی کنید.'
  } finally {
    if (currentRequest === requestVersion) {
      loading.value = false
      refreshing.value = false
    }
  }
}

const refreshDashboard = () => {
  if (!loading.value && !refreshing.value) {
    loadDashboard(true)
  }
}

/**
 * اگر همان کامپوننت برای شناسه داشبورد دیگری استفاده شد،
 * داده‌های قبلی را پاک کن و داشبورد جدید را بگیر.
 */
watch(dashboardId, () => {
  stopAutoRefresh()
  rawResponse.value = null
  lastUpdatedAt.value = null
  errorMessage.value = ''
  refreshing.value = false

  loadDashboard()
})

onMounted(() => {
  loadDashboard()
})

onBeforeUnmount(() => {
  requestVersion++
  stopAutoRefresh()
})
</script>

<template>
  <main
    class="dashboard-shell min-h-screen overflow-hidden text-gray-100"
    :style="dashboardStyle"
    dir="rtl"
  >
    <!-- نورهای پس‌زمینه -->
    <div class="background-effects" aria-hidden="true">
      <div class="orb orb-purple"></div>
      <div class="orb orb-blue"></div>
      <div class="orb orb-green"></div>
      <div class="background-grid"></div>
    </div>

    <div class="relative z-10 mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      <!-- Loading -->
      <section
        v-if="loading"
        class="flex min-h-[75vh] items-center justify-center"
      >
        <div class="glass-panel flex flex-col items-center rounded-3xl px-12 py-10">
          <div class="loader-ring">
            <div class="loader-core"></div>
          </div>

          <h2 class="mt-6 text-lg font-bold text-white">
            در حال بارگذاری داشبورد
          </h2>

          <p class="mt-2 text-sm text-gray-400">
            داده‌ها در حال دریافت از سرور هستند...
          </p>
        </div>
      </section>

      <!-- Error -->
      <section
        v-else-if="errorMessage"
        class="flex min-h-[75vh] items-center justify-center"
      >
        <div class="glass-panel error-panel w-full max-w-xl rounded-3xl p-8">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-2xl"
            >
              ⚠️
            </div>

            <div class="flex-1">
              <h2 class="text-lg font-bold text-white">
                دریافت اطلاعات ناموفق بود
              </h2>

              <p class="mt-2 text-sm leading-7 text-red-200/80">
                {{ errorMessage }}
              </p>

              <button
                type="button"
                class="action-button mt-5"
                @click="loadDashboard()"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Dashboard -->
      <template v-else-if="dashboardMeta">
        <!-- هدر ثابت و بدون افکت transform -->
        <header class="glass-header mb-7 rounded-3xl p-5 md:p-7">
          <div
            class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <!-- اطلاعات داشبورد -->
            <div class="flex min-w-0 items-start gap-4">
              <div
                class="dashboard-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              >
                <svg
                  class="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                  <h1 class="truncate text-2xl font-black text-white md:text-3xl">
                    {{ dashboardMeta.title || 'داشبورد بدون عنوان' }}
                  </h1>

                  <span
                    v-if="dashboardMeta.isPublic"
                    class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300"
                  >
                    عمومی
                  </span>
                </div>

                <p
                  v-if="dashboardMeta.description"
                  class="mt-2 max-w-3xl text-sm leading-7 text-gray-400"
                >
                  {{ dashboardMeta.description }}
                </p>

                <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                  <span class="text-blue-300">
                    کد داشبورد:
                    <strong class="font-mono font-medium">
                      {{
                        dashboardMeta.dashboardCode ||
                        dashboardMeta.dashboardId
                      }}
                    </strong>
                  </span>

                  <span class="text-gray-500">
                    تعداد ویجت‌ها:
                    <strong class="text-gray-300">
                      {{ widgetList.filter(item => item.widget.isVisible !== false).length }}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <!-- کنترل‌های بروزرسانی -->
            <div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div class="status-box rounded-2xl px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2.5 w-2.5">
                    <span
                      class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"
                    ></span>
                    <span
                      class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"
                    ></span>
                  </span>

                  <span class="text-xs font-bold text-emerald-300">
                    بروزرسانی خودکار فعال
                  </span>
                </div>

                <p class="mt-1.5 text-[11px] text-gray-500">
                  هر {{ refreshRate }} ثانیه · {{ formattedLastUpdated }}
                </p>
              </div>

              <button
                type="button"
                class="refresh-button"
                :class="{ 'is-refreshing': refreshing }"
                :disabled="refreshing"
                title="بروزرسانی داشبورد"
                @click="refreshDashboard"
              >
                <svg
                  class="h-5 w-5"
                  :class="{ 'animate-spin': refreshing }"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <span>
                  {{ refreshing ? 'در حال بروزرسانی' : 'بروزرسانی' }}
                </span>
              </button>
            </div>
          </div>
        </header>

        <!-- وضعیت رفرش -->
        <div
          v-if="refreshing"
          class="mb-4 flex items-center gap-2 text-xs text-blue-300"
        >
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"></span>
          در حال دریافت جدیدترین داده‌ها...
        </div>

        <!-- ویجت‌ها -->
        <section v-if="widgetList.length">
          <DashboardGrid :widgets="widgetList" :advanced="dashboardMeta?.layoutType === 'ADVANCED'" />
        </section>

        <!-- حالت بدون ویجت -->
        <section
          v-else
          class="glass-panel flex min-h-[420px] flex-col items-center justify-center rounded-3xl p-8 text-center"
        >
          <div
            class="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-4xl"
          >
            📊
          </div>

          <h2 class="mt-5 text-xl font-bold text-white">
            ویجتی برای نمایش وجود ندارد
          </h2>

          <p class="mt-2 max-w-md text-sm leading-7 text-gray-400">
            برای این داشبورد هنوز ویجت فعالی تعریف نشده است.
          </p>
        </section>

        <!-- فوتر -->
        <footer
          class="mt-8 flex flex-col gap-2 border-t border-white/5 py-5 text-[11px] text-gray-600 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            داشبورد داینامیک ·
            {{ dashboardMeta.dashboardCode || dashboardMeta.dashboardId }}
          </span>

          <span v-if="dashboardMeta.createdBy">
            ایجادکننده: {{ dashboardMeta.createdBy }}
          </span>
        </footer>
      </template>
    </div>
  </main>
</template>

<style scoped>
.dashboard-shell {
  --dashboard-bg: #17151c;
  --dashboard-accent: #aaa2b3;
  --dashboard-card-bg: #292531;

  position: relative;
  isolation: isolate;
  background:
    radial-gradient(
      circle at 82% 15%,
      rgba(115, 83, 190, 0.18),
      transparent 28%
    ),
    radial-gradient(
      circle at 12% 70%,
      rgba(16, 185, 129, 0.1),
      transparent 30%
    ),
    radial-gradient(
      circle at 50% 110%,
      rgba(59, 130, 246, 0.12),
      transparent 35%
    ),
    var(--dashboard-bg);
}

.background-effects {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.background-grid {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, black, transparent 90%);
}

.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.45;
}

.orb-purple {
  top: -150px;
  right: 5%;
  width: 420px;
  height: 420px;
  background: rgba(126, 87, 194, 0.22);
}

.orb-blue {
  top: 35%;
  left: -170px;
  width: 390px;
  height: 390px;
  background: rgba(59, 130, 246, 0.12);
}

.orb-green {
  right: 22%;
  bottom: -220px;
  width: 460px;
  height: 460px;
  background: rgba(16, 185, 129, 0.1);
}

.glass-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.035) 50%,
    rgba(255, 255, 255, 0.06)
  );
  border: 1px solid rgba(255, 255, 255, 0.11);
  backdrop-filter: blur(20px) saturate(135%);
  -webkit-backdrop-filter: blur(20px) saturate(135%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.13),
    0 14px 35px rgba(0, 0, 0, 0.22),
    0 35px 80px rgba(0, 0, 0, 0.12);
}

.glass-panel::before {
  content: "";
  position: absolute;
  top: 0;
  right: 5%;
  left: 5%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.27),
    transparent
  );
  pointer-events: none;
}

/*
 * عمداً هیچ استایل .dashboard-header، انیمیشن ورود
 * یا transform برای هاور هدر تعریف نشده است.
 * ظاهر هدر از .glass-header در src/main.css می‌آید.
 */

.dashboard-icon {
  color: #c4b5fd;
  background: linear-gradient(
    145deg,
    rgba(139, 92, 246, 0.24),
    rgba(59, 130, 246, 0.1)
  );
  border: 1px solid rgba(167, 139, 250, 0.25);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 10px 25px rgba(76, 29, 149, 0.22);
}

.status-box {
  background: rgba(16, 185, 129, 0.065);
  border: 1px solid rgba(52, 211, 153, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.refresh-button,
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0 1rem;
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.04)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 8px 18px rgba(0, 0, 0, 0.16);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.refresh-button:hover:not(:disabled),
.action-button:hover {
  transform: translateY(-2px);
  color: white;
  border-color: rgba(96, 165, 250, 0.35);
  background-color: rgba(59, 130, 246, 0.12);
}

.refresh-button:active:not(:disabled),
.action-button:active {
  transform: translateY(0);
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.error-panel {
  border-color: rgba(248, 113, 113, 0.22);
}

.loader-ring {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 9999px;
  background: conic-gradient(
    from 90deg,
    transparent,
    rgba(96, 165, 250, 0.2),
    #60a5fa
  );
  animation: loader-rotate 1s linear infinite;
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
}

.loader-core {
  width: 52px;
  height: 52px;
  border-radius: 9999px;
  background: #1b1821;
}

@keyframes loader-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-ring {
    animation: none;
  }
}

@supports not (
  (backdrop-filter: blur(1px)) or
  (-webkit-backdrop-filter: blur(1px))
) {
  .glass-panel {
    background: var(--dashboard-card-bg);
  }
}
</style>
