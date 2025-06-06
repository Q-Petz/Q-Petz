<template>
  <div ref="container" class="model-container"></div>
</template>

<script setup lang="ts">
import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import { Window } from "@tauri-apps/api/window";
import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useModelEvents } from "../hooks/useModelEvents";
import { TauriEvents, useModelConfigStore } from "../store/modelConfigStore";
import { ModelManager } from "./ModelManager";

const container = ref<HTMLDivElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationFrameId: number;
let controls: OrbitControls;
let modelManager: ModelManager;
let clock: THREE.Clock;
let appWindow: Window;

// 存储事件取消订阅函数
const unlistenFunctions: UnlistenFn[] = [];

// 获取模型配置
const modelConfigStore = useModelConfigStore();

// 可以在这里配置要加载的模型
const modelConfigs = [
  {
    id: "heli",
    config: {
      path: "/model/heli.glb",
      options: {
        scale: modelConfigStore.modelScale,
        position: new THREE.Vector3(0, -1.5, 0), // 将模型向下移动1.5个单位
        rotation: new THREE.Euler(0, -Math.PI / 2, 0), // 旋转不变
      },
      autoRotate: modelConfigStore.modelAutoRotate,
      floatAnimation: modelConfigStore.modelFloatAnimation,
    },
  },
  // 可以添加更多模型配置
];

// 光源引用
let ambientLight: THREE.AmbientLight;
let directionalLight: THREE.DirectionalLight;

async function init() {
  if (!container.value) return;

  // 从本地存储加载配置
  modelConfigStore.loadFromLocalStorage();

  // 初始化Tauri窗口
  appWindow = Window.getCurrent();

  // 创建场景
  scene = new THREE.Scene();
  scene.background =
    modelConfigStore.backgroundColor === "transparent"
      ? null
      : new THREE.Color(modelConfigStore.backgroundColor);

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    Number(modelConfigStore.cameraFov),
    container.value.clientWidth / container.value.clientHeight,
    0.2,
    1000
  );
  camera.position.set(0, 1, Number(modelConfigStore.cameraDistance)); // 使用配置的相机距离
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: modelConfigStore.backgroundColor === "transparent",
  });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setClearColor(0x000000, modelConfigStore.backgroundColor === "transparent" ? 0 : 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  // 添加灯光
  ambientLight = new THREE.AmbientLight(
    modelConfigStore.lightColor,
    Number(modelConfigStore.lightIntensity)
  );
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(
    modelConfigStore.lightColor,
    Number(modelConfigStore.lightIntensity)
  );
  const lightPos = modelConfigStore.lightPosition;
  directionalLight.position.set(Number(lightPos.x), Number(lightPos.y), Number(lightPos.z));
  scene.add(directionalLight);

  // 调试用
  // controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.25;

  // 初始化时钟
  clock = new THREE.Clock();

  // 初始化模型管理器
  modelManager = new ModelManager(scene);

  // 设置模型管理器的旋转速度
  modelManager.setRotationSpeed(Number(modelConfigStore.rotationSpeed));

  // 加载配置的模型
  await loadModels();

  // 开始动画循环
  animate();

  // 初始化完成后，设置事件监听
  useModelEvents(container, camera, renderer, modelManager, appWindow);

  // 使用Tauri IPC事件监听配置变化
  setupEventListeners();

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
}

async function loadModels() {
  try {
    // 更新模型配置
    updateModelConfigs();

    for (const modelEntry of modelConfigs) {
      const loadedModel = await modelManager.loadModel(modelEntry.id, modelEntry.config);
      console.log(`模型 ${modelEntry.id} 加载成功`);
    }

    // 加载后立即应用当前配置
    updateModelFromConfig();
  } catch (error) {
    console.error("加载模型失败:", error);
  }
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  // 更新所有模型的动画
  if (modelManager) {
    modelManager.update();
  }

  // 渲染场景
  renderer.render(scene, camera);
}

// 更新模型配置
function updateModelConfigs() {
  // 清除现有配置
  modelConfigs.length = 0;

  // 使用来自store的值创建新配置
  modelConfigs.push({
    id: "heli",
    config: {
      path: "/model/heli.glb",
      options: {
        scale: Number(modelConfigStore.modelScale),
        position: new THREE.Vector3(0, -1.5, 0), // 将模型向下移动1.5个单位
        rotation: new THREE.Euler(0, -Math.PI / 2, 0), // 旋转不变
      },
      autoRotate: Boolean(modelConfigStore.modelAutoRotate),
      floatAnimation: Boolean(modelConfigStore.modelFloatAnimation),
    },
  });
}

// 设置Tauri IPC事件监听
async function setupEventListeners() {
  // 光源配置变更
  const unlistenLight = await listen(TauriEvents.LIGHT_CHANGED, (event) => {
    if (ambientLight && directionalLight) {
      // 更新光源强度和颜色
      ambientLight.intensity = Number(modelConfigStore.lightIntensity);
      ambientLight.color.set(modelConfigStore.lightColor);

      directionalLight.intensity = Number(modelConfigStore.lightIntensity);
      directionalLight.color.set(modelConfigStore.lightColor);

      // 更新光源位置
      const lightPos = modelConfigStore.lightPosition;
      directionalLight.position.set(Number(lightPos.x), Number(lightPos.y), Number(lightPos.z));
    }
  });
  unlistenFunctions.push(unlistenLight);

  // 相机配置变更
  const unlistenCamera = await listen(TauriEvents.CAMERA_CHANGED, (event) => {
    if (camera) {
      camera.fov = Number(modelConfigStore.cameraFov);
      camera.position.z = Number(modelConfigStore.cameraDistance);
      camera.updateProjectionMatrix();
    }
  });
  unlistenFunctions.push(unlistenCamera);

  // 背景配置变更
  const unlistenBackground = await listen(TauriEvents.BACKGROUND_CHANGED, (event) => {
    if (scene && renderer) {
      if (modelConfigStore.backgroundColor === "transparent") {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
      } else {
        scene.background = new THREE.Color(modelConfigStore.backgroundColor);
        renderer.setClearColor(new THREE.Color(modelConfigStore.backgroundColor), 1);
      }
    }
  });
  unlistenFunctions.push(unlistenBackground);

  // 模型配置变更
  const unlistenModel = await listen(TauriEvents.MODEL_CHANGED, (event) => {
    updateModelFromConfig();
  });
  unlistenFunctions.push(unlistenModel);

  // 旋转速度变更
  const unlistenRotation = await listen(TauriEvents.ROTATION_CHANGED, (event) => {
    modelManager.setRotationSpeed(Number(modelConfigStore.rotationSpeed));
  });
  unlistenFunctions.push(unlistenRotation);
}

// 根据配置更新模型
function updateModelFromConfig() {
  const heliModel = modelManager.getModel("heli");
  if (heliModel && heliModel.object) {
    modelManager.updateModelConfig("heli", {
      autoRotate: Boolean(modelConfigStore.modelAutoRotate),
      floatAnimation: Boolean(modelConfigStore.modelFloatAnimation),
      options: {
        scale: Number(modelConfigStore.modelScale),
      },
    });
  }
}

// 处理窗口大小变化
function handleResize() {
  if (!container.value || !camera || !renderer) return;

  // 更新相机宽高比
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();

  // 更新渲染器大小
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  // 取消所有事件监听
  unlistenFunctions.forEach((unlisten) => unlisten());

  cancelAnimationFrame(animationFrameId);
  if (renderer) {
    renderer.dispose();
  }
  // 移除窗口大小变化事件监听
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
  .model-container {
    width: 100%;
    height: 100%;
    cursor: pointer;
    position: fixed;
    top: 0;
    left: 0;
  }
</style>

<script lang="ts">
  // 为了支持命名导出
  export default { name: "ModelViewer" };
</script>
