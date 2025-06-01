<template>
  <div class="model-configuration">
    <h1>模型参数配置</h1>

    <div class="config-section">
      <h2>光源配置</h2>
      <div class="config-item">
        <label>光源强度：</label>
        <input
          type="range"
          v-model="lightIntensity"
          min="0"
          max="10"
          step="0.1"
        />
        <span>{{ lightIntensity }}</span>
      </div>
      <div class="config-item">
        <label>光源颜色：</label>
        <input type="color" v-model="lightColor" />
      </div>
      <div class="config-item">
        <label>光源位置：</label>
        <div class="position-inputs">
          <div>
            <label>X:</label>
            <input type="number" v-model="lightPosition.x" step="0.1" />
          </div>
          <div>
            <label>Y:</label>
            <input type="number" v-model="lightPosition.y" step="0.1" />
          </div>
          <div>
            <label>Z:</label>
            <input type="number" v-model="lightPosition.z" step="0.1" />
          </div>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h2>模型大小配置</h2>
      <div class="config-item">
        <label>模型缩放：</label>
        <input type="range" v-model="modelScale" min="0.1" max="5" step="0.1" />
        <span>{{ modelScale }}</span>
      </div>
    </div>

    <div class="config-section">
      <h2>相机配置</h2>
      <div class="config-item">
        <label>相机距离：</label>
        <input
          type="range"
          v-model="cameraDistance"
          min="1"
          max="20"
          step="0.5"
        />
        <span>{{ cameraDistance }}</span>
      </div>
      <div class="config-item">
        <label>相机视角：</label>
        <input type="range" v-model="cameraFov" min="10" max="120" step="1" />
        <span>{{ cameraFov }}°</span>
      </div>
    </div>

    <div class="config-section">
      <h2>背景配置</h2>
      <div class="config-item">
        <label>背景颜色：</label>
        <input type="color" v-model="backgroundColor" />
      </div>
    </div>

    <div class="config-section">
      <h2>动画配置</h2>
      <div class="config-item">
        <label>自动旋转：</label>
        <input type="checkbox" v-model="autoRotate" />
      </div>
      <div class="config-item" v-if="autoRotate">
        <label>旋转速度：</label>
        <input
          type="range"
          v-model="rotationSpeed"
          min="0.1"
          max="5"
          step="0.1"
        />
        <span>{{ rotationSpeed }}</span>
      </div>
    </div>

    <div class="actions">
      <button @click="saveConfig">保存配置</button>
      <button @click="resetConfig">重置配置</button>
      <button @click="applyConfig">应用配置</button>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, reactive } from "vue";

  export default defineComponent({
    name: "ModelConfiguration",
    setup() {
      // 光源配置
      const lightIntensity = ref(1.0);
      const lightColor = ref("#ffffff");
      const lightPosition = reactive({
        x: 5,
        y: 5,
        z: 5,
      });

      // 模型大小配置
      const modelScale = ref(1.0);

      // 相机配置
      const cameraDistance = ref(5);
      const cameraFov = ref(75);

      // 背景配置
      const backgroundColor = ref("#f0f0f0");

      // 动画配置
      const autoRotate = ref(false);
      const rotationSpeed = ref(1.0);

      // 默认配置，用于重置
      const defaultConfig = {
        lightIntensity: 1.0,
        lightColor: "#ffffff",
        lightPosition: { x: 5, y: 5, z: 5 },
        modelScale: 1.0,
        cameraDistance: 5,
        cameraFov: 75,
        backgroundColor: "#f0f0f0",
        autoRotate: false,
        rotationSpeed: 1.0,
      };

      // 保存配置到本地存储
      const saveConfig = () => {
        const config = {
          lightIntensity: lightIntensity.value,
          lightColor: lightColor.value,
          lightPosition: { ...lightPosition },
          modelScale: modelScale.value,
          cameraDistance: cameraDistance.value,
          cameraFov: cameraFov.value,
          backgroundColor: backgroundColor.value,
          autoRotate: autoRotate.value,
          rotationSpeed: rotationSpeed.value,
        };

        localStorage.setItem("modelConfig", JSON.stringify(config));
        alert("配置已保存");
      };

      // 从本地存储加载配置
      const loadConfig = () => {
        const savedConfig = localStorage.getItem("modelConfig");
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            lightIntensity.value = config.lightIntensity;
            lightColor.value = config.lightColor;
            Object.assign(lightPosition, config.lightPosition);
            modelScale.value = config.modelScale;
            cameraDistance.value = config.cameraDistance;
            cameraFov.value = config.cameraFov;
            backgroundColor.value = config.backgroundColor;
            autoRotate.value = config.autoRotate;
            rotationSpeed.value = config.rotationSpeed;
          } catch (e) {
            console.error("加载配置失败", e);
          }
        }
      };

      // 重置配置
      const resetConfig = () => {
        lightIntensity.value = defaultConfig.lightIntensity;
        lightColor.value = defaultConfig.lightColor;
        Object.assign(lightPosition, defaultConfig.lightPosition);
        modelScale.value = defaultConfig.modelScale;
        cameraDistance.value = defaultConfig.cameraDistance;
        cameraFov.value = defaultConfig.cameraFov;
        backgroundColor.value = defaultConfig.backgroundColor;
        autoRotate.value = defaultConfig.autoRotate;
        rotationSpeed.value = defaultConfig.rotationSpeed;
      };

      // 应用配置到模型
      const applyConfig = () => {
        // 这里需要实现将配置应用到3D模型的逻辑
        // 可能需要通过事件总线或者Vuex/Pinia状态管理来实现
        // 例如：emitter.emit('applyModelConfig', { ... })
        console.log("应用配置", {
          lightIntensity: lightIntensity.value,
          lightColor: lightColor.value,
          lightPosition: { ...lightPosition },
          modelScale: modelScale.value,
          cameraDistance: cameraDistance.value,
          cameraFov: cameraFov.value,
          backgroundColor: backgroundColor.value,
          autoRotate: autoRotate.value,
          rotationSpeed: rotationSpeed.value,
        });
        alert("配置已应用");
      };

      // 初始化时加载已保存的配置
      loadConfig();

      return {
        lightIntensity,
        lightColor,
        lightPosition,
        modelScale,
        cameraDistance,
        cameraFov,
        backgroundColor,
        autoRotate,
        rotationSpeed,
        saveConfig,
        resetConfig,
        applyConfig,
      };
    },
  });
</script>

<style scoped>
  .model-configuration {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    text-align: center;
    margin-bottom: 30px;
  }

  .config-section {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .config-section h2 {
    margin-top: 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    font-size: 1.2em;
  }

  .config-item {
    display: flex;
    align-items: center;
    margin: 15px 0;
    flex-wrap: wrap;
  }

  .config-item label {
    width: 100px;
    font-weight: 500;
  }

  .config-item input[type="range"] {
    flex: 1;
    margin: 0 10px;
  }

  .position-inputs {
    display: flex;
    gap: 10px;
  }

  .position-inputs div {
    display: flex;
    align-items: center;
  }

  .position-inputs label {
    width: 20px;
  }

  .position-inputs input {
    width: 60px;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
  }

  button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #45a049;
  }

  button:nth-child(2) {
    background-color: #f44336;
  }

  button:nth-child(2):hover {
    background-color: #d32f2f;
  }

  button:nth-child(3) {
    background-color: #2196f3;
  }

  button:nth-child(3):hover {
    background-color: #0b7dda;
  }
</style>
