<template>
  <div class="overflow-y-auto model-configuration">
    <h1>模型参数配置</h1>

    <div class="config-card">
      <div class="card-header">
        <div class="header-icon light-icon"></div>
        <h2>光源配置</h2>
      </div>
      <div class="config-content">
        <div class="config-item">
          <label>光源强度</label>
          <div class="slider-container">
            <input
              type="range"
              v-model.number="store.lightIntensity"
              min="0"
              max="10"
              step="0.1"
            />
            <span class="value-display">{{
              Number(store.lightIntensity).toFixed(1)
            }}</span>
          </div>
        </div>
        <div class="config-item">
          <label>光源颜色</label>
          <div class="color-picker">
            <input type="color" v-model="store.lightColor" />
            <span class="color-value">{{ store.lightColor }}</span>
          </div>
        </div>
        <div class="config-item position-inputs-container">
          <label>光源位置</label>
          <div class="position-inputs">
            <div class="position-input">
              <span class="axis">X</span>
              <input
                type="number"
                v-model.number="store.lightPosition.x"
                step="0.1"
              />
            </div>
            <div class="position-input">
              <span class="axis">Y</span>
              <input
                type="number"
                v-model.number="store.lightPosition.y"
                step="0.1"
              />
            </div>
            <div class="position-input">
              <span class="axis">Z</span>
              <input
                type="number"
                v-model.number="store.lightPosition.z"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-header">
        <div class="header-icon model-icon"></div>
        <h2>模型配置</h2>
      </div>
      <div class="config-content">
        <div class="config-item">
          <label>模型缩放</label>
          <div class="slider-container">
            <input
              type="range"
              v-model.number="store.modelScale"
              min="0.1"
              max="5"
              step="0.1"
            />
            <span class="value-display">{{
              Number(store.modelScale).toFixed(1)
            }}</span>
          </div>
        </div>
        <div class="config-item toggle">
          <label>自动旋转</label>
          <label class="switch">
            <input type="checkbox" v-model="store.modelAutoRotate" />
            <span class="slider round"></span>
          </label>
        </div>
        <div class="config-item toggle">
          <label>浮动动画</label>
          <label class="switch">
            <input type="checkbox" v-model="store.modelFloatAnimation" />
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-header">
        <div class="header-icon camera-icon"></div>
        <h2>相机配置</h2>
      </div>
      <div class="config-content">
        <div class="config-item">
          <label>相机距离</label>
          <div class="slider-container">
            <input
              type="range"
              v-model.number="store.cameraDistance"
              min="1"
              max="20"
              step="0.5"
            />
            <span class="value-display">{{
              Number(store.cameraDistance).toFixed(1)
            }}</span>
          </div>
        </div>
        <div class="config-item">
          <label>相机视角</label>
          <div class="slider-container">
            <input
              type="range"
              v-model.number="store.cameraFov"
              min="10"
              max="120"
              step="1"
            />
            <span class="value-display">{{ Number(store.cameraFov) }}°</span>
          </div>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-header">
        <div class="header-icon background-icon"></div>
        <h2>背景配置</h2>
      </div>
      <div class="config-content">
        <div class="config-item">
          <label>背景颜色</label>
          <div class="background-options">
            <div class="background-option">
              <button
                class="transparent-bg"
                :class="{ selected: store.backgroundColor === 'transparent' }"
                @click="setBackgroundTransparent"
              >
                透明
              </button>
            </div>
            <div class="background-option">
              <div class="color-picker">
                <input
                  type="color"
                  v-model="backgroundColor"
                  @input="updateBackgroundColor"
                  :disabled="store.backgroundColor === 'transparent'"
                />
                <span class="color-value">
                  {{
                    store.backgroundColor === "transparent"
                      ? "透明"
                      : backgroundColor
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="config-card" v-if="store.modelAutoRotate">
      <div class="card-header">
        <div class="header-icon animation-icon"></div>
        <h2>动画配置</h2>
      </div>
      <div class="config-content">
        <div class="config-item">
          <label>旋转速度</label>
          <div class="slider-container">
            <input
              type="range"
              v-model.number="store.rotationSpeed"
              min="0.001"
              max="0.01"
              step="0.001"
            />
            <span class="value-display">{{
              Number(store.rotationSpeed).toFixed(3)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button class="save-button" @click="saveConfig">
        <span class="button-icon save-icon"></span>
        保存配置
      </button>
      <button class="reset-button" @click="resetConfig">
        <span class="button-icon reset-icon"></span>
        重置默认
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useModelConfigStore } from "../../store/modelConfigStore";

// 获取状态存储
const store = useModelConfigStore();

// 背景颜色需要特殊处理，因为'transparent'不是有效的颜色值
const backgroundColor = ref(
  store.backgroundColor === "transparent" ? "#ffffff" : store.backgroundColor
);

// 从本地存储加载配置
onMounted(() => {
  store.loadFromLocalStorage();
  if (store.backgroundColor !== "transparent") {
    backgroundColor.value = store.backgroundColor;
  }
});

// 保存配置到本地存储
const saveConfig = () => {
  store.saveToLocalStorage();
  showToast("配置已保存");
};

// 重置配置
const resetConfig = () => {
  store.resetToDefaults();
  backgroundColor.value =
    store.backgroundColor === "transparent" ? "#ffffff" : store.backgroundColor;
  showToast("已重置为默认配置");
};

// 更新背景颜色
const updateBackgroundColor = () => {
  store.updateBackgroundConfig(backgroundColor.value);
};

// 设置透明背景
const setBackgroundTransparent = () => {
  store.updateBackgroundConfig("transparent");
};

// 显示提示消息
const showToast = (message: string) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }, 100);
};

// 监听配置变化确保数值类型一致
watch(
  () => [
    store.lightIntensity,
    store.modelScale,
    store.cameraDistance,
    store.cameraFov,
    store.rotationSpeed,
  ],
  ([lightIntensity, modelScale, cameraDistance, cameraFov, rotationSpeed]) => {
    store.lightIntensity = Number(lightIntensity);
    store.modelScale = Number(modelScale);
    store.cameraDistance = Number(cameraDistance);
    store.cameraFov = Number(cameraFov);
    store.rotationSpeed = Number(rotationSpeed);
  }
);

// 监听光源位置变化确保数值类型一致
watch(
  () => store.lightPosition,
  (position) => {
    store.lightPosition.x = Number(position.x);
    store.lightPosition.y = Number(position.y);
    store.lightPosition.z = Number(position.z);
  },
  { deep: true }
);
</script>

<style>
  /* 动态生成的Toast提示样式 */
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(30px);
    background-color: #323232;
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 9999;
    opacity: 0;
    transition: transform 0.3s, opacity 0.3s;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  }

  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>

<style scoped>
  .model-configuration {
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;
    font-family: "Roboto", "Noto Sans SC", sans-serif;
    color: #1f1f1f;
    height: 100vh;
    overflow-y: auto;
  }

  .overflow-y-auto {
    overflow-y: auto;
    height: 100vh;
    max-height: 100%;
  }

  h1 {
    text-align: center;
    margin-bottom: 40px;
    font-weight: 500;
    color: #1f1f1f;
  }

  .config-card {
    background-color: #ffffff;
    border-radius: 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: box-shadow 0.3s;
  }

  .config-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    display: flex;
    align-items: center;
    padding: 20px 24px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #f0f0f0;
  }

  .header-icon {
    width: 28px;
    height: 28px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    margin-right: 16px;
  }

  .light-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath d='M480-360q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T520-480q0-17-11.5-28.5T480-520q-17 0-28.5 11.5T440-480q0 17 11.5 28.5T480-440ZM200-440h80q0-83 58.5-141.5T480-640v-80q-117 0-198.5 81.5T200-440Zm480 0h80q0-117-81.5-198.5T480-720v80q83 0 141.5 58.5T680-440ZM480-240v-80q-83 0-141.5-58.5T280-520h-80q0 117 81.5 198.5T480-240Zm0 0v80q117 0 198.5-81.5T760-440h-80q0 83-58.5 141.5T480-240Z'/%3E%3C/svg%3E");
  }

  .model-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath d='M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252v-356l320-184 320 184v356l-320 184-320-184Z'/%3E%3C/svg%3E");
  }

  .camera-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath d='M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Z'/%3E%3C/svg%3E");
  }

  .background-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath d='M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z'/%3E%3C/svg%3E");
  }

  .animation-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath d='m388-80-20-126q-19-7-40-19t-37-25l-118 54-93-164 108-79q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521L80-600l93-164 118 54q16-13 37-25t40-18l20-127h184l20 126q19 7 40.5 18.5T669-710l118-54 93 164-108 77q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l108 78-93 164-118-54q-16 13-36.5 25.5T592-206L572-80H388Zm92-270q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Z'/%3E%3C/svg%3E");
  }

  .save-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath fill='white' d='M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-640h360v-80H240v80Zm-40-80v560-560Z'/%3E%3C/svg%3E");
  }

  .reset-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24'%3E%3Cpath fill='white' d='M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z'/%3E%3C/svg%3E");
  }

  .card-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }

  .config-content {
    padding: 24px;
  }

  .config-item {
    margin-bottom: 24px;
  }

  .config-item:last-child {
    margin-bottom: 0;
  }

  .config-item label {
    display: block;
    font-size: 14px;
    margin-bottom: 12px;
    color: #5f6368;
    font-weight: 500;
  }

  .slider-container {
    display: flex;
    align-items: center;
  }

  input[type="range"] {
    flex-grow: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #dadce0;
    border-radius: 2px;
    outline: none;
    margin-right: 16px;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #1a73e8;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: background 0.3s;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    background: #1967d2;
    transform: scale(1.1);
  }

  .value-display {
    min-width: 40px;
    text-align: right;
    font-family: "Roboto Mono", monospace;
    font-size: 14px;
  }

  .color-picker {
    display: flex;
    align-items: center;
  }

  input[type="color"] {
    -webkit-appearance: none;
    appearance: none;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    overflow: hidden;
    margin-right: 16px;
    box-shadow: 0 0 0 1px #dadce0;
  }

  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
  }

  .color-value {
    font-family: "Roboto Mono", monospace;
    font-size: 14px;
  }

  .position-inputs-container {
    margin-top: 16px;
  }

  .position-inputs {
    display: flex;
    gap: 16px;
  }

  .position-input {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .axis {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e8f0fe;
    color: #1a73e8;
    border-radius: 50%;
    font-weight: 600;
    margin-right: 8px;
    font-size: 12px;
  }

  .position-input input[type="number"] {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dadce0;
    border-radius: 4px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.3s;
  }

  .position-input input[type="number"]:focus {
    border-color: #1a73e8;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    border: none;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  }

  .save-button {
    background-color: #1a73e8;
    color: white;
  }

  .save-button:hover {
    background-color: #1967d2;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  }

  .reset-button {
    background-color: #5f6368;
    color: white;
  }

  .reset-button:hover {
    background-color: #4a4d51;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  }

  .button-icon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .config-item.toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #dadce0;
    transition: 0.4s;
  }

  .switch .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.4s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .switch input:checked + .slider {
    background-color: #1a73e8;
  }

  .switch input:checked + .slider:before {
    transform: translateX(24px);
  }

  .switch .slider.round {
    border-radius: 24px;
  }

  .switch .slider.round:before {
    border-radius: 50%;
  }

  .background-options {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .background-option {
    display: flex;
    align-items: center;
  }

  .transparent-bg {
    background: linear-gradient(
        45deg,
        #eeeeee 25%,
        transparent 25%,
        transparent 75%,
        #eeeeee 75%,
        #eeeeee
      ),
      linear-gradient(
        45deg,
        #eeeeee 25%,
        transparent 25%,
        transparent 75%,
        #eeeeee 75%,
        #eeeeee
      );
    background-size: 16px 16px;
    background-position: 0 0, 8px 8px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    cursor: pointer;
    box-shadow: 0 0 0 1px #dadce0;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
    font-size: 0;
    color: transparent;
  }

  .transparent-bg:hover {
    box-shadow: 0 0 0 2px #1a73e8;
  }

  .transparent-bg.selected {
    box-shadow: 0 0 0 2px #1a73e8;
  }

  .transparent-bg.selected::after {
    content: "";
    position: absolute;
    width: 14px;
    height: 14px;
    background-color: #1a73e8;
    border-radius: 50%;
  }
</style>
