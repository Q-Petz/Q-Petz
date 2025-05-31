<script setup lang="ts">
  import ModelViewer from "./components/ModelViewer.vue";
</script>

<template>
  <ModelViewer />
</template>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: transparent;
  }

  body {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  #app {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    position: fixed;
    top: 0;
    left: 0;
  }

  /* 确保所有元素都是透明的 */
  html,
  body,
  #app {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
</style>
