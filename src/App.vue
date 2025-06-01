<script setup lang="ts">
  import ModelViewer from "./components/ModelViewer.vue";
  import { useRoute } from "vue-router";
  import { computed } from "vue";

  const route = useRoute();

  // 判断是否为主路径（不是其他特定页面）
  const isMainPath = computed(() => {
    return route.path === "/";
  });
</script>

<template>
  <div class="w-full h-full flex justify-center items-center">
    <!-- 在主路径显示主应用 -->
    <ModelViewer v-if="isMainPath" />
    <!-- 在其他路径显示对应页面 -->
    <router-view v-else />
  </div>
</template>

<style></style>
