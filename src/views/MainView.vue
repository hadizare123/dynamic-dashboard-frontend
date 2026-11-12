<template>
  <div class="min-h-screen bg-[#17151C] text-gray-100 flex" dir="rtl">
    <!-- سایدبار منو (سمت راست) -->
    <aside
      :class="[
        'bg-[#1f1b24] border-l border-gray-800 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20 p-3' : 'w-64 p-6'
      ]"
    >
      <div>
        <!-- هدر سایدبار + دکمه جمع‌شونده -->
        <div
          :class="[
            'flex items-center mb-8 pb-4 border-b border-gray-800/80',
            isCollapsed ? 'justify-center' : 'justify-between gap-3'
          ]"
        >
          <div v-if="!isCollapsed" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner shrink-0">
              ⚡
            </div>
            <div class="whitespace-nowrap">
              <h1 class="text-base font-bold text-white tracking-wide">سامانه داده‌ها</h1>
              <p class="text-xs text-blue-400 font-medium">داشبورد یکپارچه</p>
            </div>
          </div>

          <button
            @click="isCollapsed = !isCollapsed"
            class="w-9 h-9 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition shrink-0"
            :title="isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'"
          >
            <span class="text-lg leading-none">{{ isCollapsed ? '☰' : '✕' }}</span>
          </button>
        </div>

        <!-- لینک‌های منو -->
        <nav class="space-y-2">
          <router-link
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            :title="isCollapsed ? item.label : ''"
            :class="[
              'flex items-center rounded-xl transition',
              isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
              isActive(item.to)
                ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30 shadow-sm'
                : 'text-gray-300 hover:bg-gray-800/70 hover:text-white border border-transparent'
            ]"
          >
            <span class="text-lg shrink-0">{{ item.icon }}</span>
            <span v-if="!isCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </router-link>
        </nav>
      </div>

      <!-- فوتر سایدبار -->
      <div
        :class="[
          'text-xs text-gray-500 border-t border-gray-800/80 pt-4',
          isCollapsed ? 'text-center' : 'text-center whitespace-nowrap'
        ]"
      >
        {{ isCollapsed ? 'v1.0' : 'سیستم یکپارچه داده‌ها - نسخه ۱.۰' }}
      </div>
    </aside>

    <!-- محتوای اصلی (وسط‌چین) -->
    <main class="flex-1 p-10 overflow-y-auto bg-[#17151C]">
      <div class="max-w-5xl mx-auto text-center">
        <header class="mb-10">
          <h2 class="text-3xl font-extrabold text-white tracking-tight">خوش آمدید، هادی عزیز 👋</h2>
          <p class="text-gray-400 mt-3 text-sm leading-relaxed max-w-2xl mx-auto">
            برای دسترسی به گزارش‌ها، ویجت‌های تحلیلی و وضعیت زنده‌ی دیتابیس از بخش‌های زیر استفاده کنید.
          </p>
        </header>

        <section>
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
            داشبوردهای فعال
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            <router-link
              to="/dashboard/1"
              class="group w-full max-w-sm bg-[#1f1b24] border border-gray-800 hover:border-blue-500/60 p-6 rounded-2xl transition duration-200 shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between text-center"
            >
              <div>
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition duration-200">
                  📊
                </div>
                <h4 class="text-xl font-bold text-white group-hover:text-blue-400 transition">
                  داشبورد مدیریتی (کد ۱)
                </h4>
                <p class="text-gray-400 text-xs mt-2 leading-relaxed">
                  نمایش کارت‌های KPI، نمودارهای تحلیلی و داده‌های جداول PostgreSQL به‌صورت بلادرنگ.
                </p>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-center gap-2 text-xs text-blue-400 font-medium">
                <span>ورود به داشبورد</span>
                <span class="transform group-hover:-translate-x-1 transition duration-200">←</span>
              </div>
            </router-link>
          </div> 
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapsed = ref(false)

const menuItems = [
  { to: '/main', icon: '📊', label: 'صفحه اصلی' },
  { to: '/dashboard/1', icon: '📈', label: 'داشبورد مدیریتی' },
   { to: '/dashboard/settings', icon: '⚙️', label: 'تنظیمات' }
]

const isActive = (path) => route.path === path
</script>
