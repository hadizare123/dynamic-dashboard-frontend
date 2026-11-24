<script setup>
import AppSidebar from "./components/AppSidebar.vue"
</script>

<template>
  <div class="flex min-h-screen bg-[#17151C] text-gray-100" dir="rtl">
    <AppSidebar />
    <div class="min-w-0 flex-1">
      <router-view />
    </div>
  </div>
</template>
