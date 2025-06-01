<template>
  <div class="demo-container">
    <h1>Demo 页面</h1>
    <p>这是通过托盘菜单打开的演示页面</p>
    <div class="demo-content">
      <button @click="closeWindow" class="close-btn">关闭窗口</button>
    </div>
  </div>
</template>

<script setup>
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

  const closeWindow = () => {
    // 获取当前窗口实例并关闭
    const currentWindow = WebviewWindow.getByLabel("demo_window");
    if (currentWindow) {
      currentWindow.close();
    }
  };
</script>

<style scoped>
  .demo-container {
    font-family: "Arial", sans-serif;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  h1 {
    color: #2c3e50;
    margin-bottom: 1rem;
  }

  p {
    color: #34495e;
    margin-bottom: 2rem;
  }

  .demo-content {
    margin-top: 2rem;
  }

  .close-btn {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }

  .close-btn:hover {
    background-color: #c0392b;
  }
</style>
