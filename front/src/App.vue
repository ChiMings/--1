<template>
  <Navbar />
  <main class="main-content">
    <router-view />
  </main>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue';
</script>
