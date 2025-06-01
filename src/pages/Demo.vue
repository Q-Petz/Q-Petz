<template>
  <div class="demo-container">
    <div class="header">
      <h1>Demo 页面222</h1>
      <button @click="closeWindow" class="close-btn">关闭</button>
    </div>
    <div class="content">
      <p>这是通过托盘菜单打开的示例页面，使用了Vue Router</p>
      <p>你可以点击页面上的按钮或右上角关闭按钮来关闭此窗口</p>
    </div>
    <div class="actions">
      <button @click="closeWindow" class="action-btn">关闭窗口</button>
    </div>
  </div>
</template>

<script setup>
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

  const closeWindow = () => {
    const window = getCurrentWebviewWindow();
    if (window) {
      window.close();
    }
  };
</script>

<style scoped>
  .demo-container {
    font-family: "Arial", sans-serif;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
    color: #333;
    background-color: #f8f8f8;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-height: 300px;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 1rem;
  }

  h1 {
    color: #2c3e50;
    margin: 0;
    font-size: 1.8rem;
  }

  .content {
    flex-grow: 1;
    line-height: 1.6;
  }

  p {
    color: #34495e;
    margin-bottom: 1rem;
  }

  .actions {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }

  .action-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }

  .action-btn:hover {
    background-color: #2980b9;
  }

  .close-btn {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.3s;
  }

  .close-btn:hover {
    background-color: #c0392b;
  }
</style>
