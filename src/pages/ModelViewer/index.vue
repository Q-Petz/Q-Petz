<template>
  <div ref="container" class="model-container"></div>
</template>

<script setup lang="ts">
import { useModelEvents } from "@/hooks/useModelEvents";
import { ModelConfigEvents, useModelConfigStore, LightType, Light } from "@/store/modelConfigStore";
import { windowComm } from "@/utils/window-communication";
import { Window } from "@tauri-apps/api/window";
import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ModelManager } from "@/components/ModelManager";

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
const unlistenFunctions: (() => void)[] = [];

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

// 光源引用映射
const lightsMap = new Map<string, THREE.Light>();

async function init() {
  if (!container.value) return;

  // 从本地存储加载配置
  modelConfigStore.loadFromLocalStorage();
  
  // 初始化配置同步
  modelConfigStore.initConfigSync();

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

  // 添加光源
  createLightsFromConfig();

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

// 创建光源
function createLightsFromConfig() {
  // 清除现有光源
  lightsMap.forEach((light) => {
    scene.remove(light);
    light.dispose?.();
  });
  lightsMap.clear();

  // 创建新光源
  modelConfigStore.enabledLights.forEach((lightConfig) => {
    const light = createLight(lightConfig);
    if (light) {
      lightsMap.set(lightConfig.id, light);
      scene.add(light);
    }
  });
}

// 根据配置创建单个光源
function createLight(lightConfig: Light): THREE.Light | null {
  let light: THREE.Light | null = null;

  switch (lightConfig.type) {
    case LightType.AMBIENT:
      light = new THREE.AmbientLight(
        new THREE.Color(lightConfig.color),
        lightConfig.intensity
      );
      break;

    case LightType.DIRECTIONAL:
      light = new THREE.DirectionalLight(
        new THREE.Color(lightConfig.color),
        lightConfig.intensity
      );
      light.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
      if (lightConfig.target) {
        (light as THREE.DirectionalLight).target.position.set(
          lightConfig.target.x,
          lightConfig.target.y,
          lightConfig.target.z
        );
        scene.add((light as THREE.DirectionalLight).target);
      }
      break;

    case LightType.POINT:
      light = new THREE.PointLight(
        new THREE.Color(lightConfig.color),
        lightConfig.intensity,
        lightConfig.distance || 0,
        lightConfig.decay || 2
      );
      light.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
      break;

    case LightType.SPOT:
      light = new THREE.SpotLight(
        new THREE.Color(lightConfig.color),
        lightConfig.intensity,
        lightConfig.distance || 0,
        lightConfig.angle || Math.PI / 4,
        lightConfig.penumbra || 0.1,
        lightConfig.decay || 2
      );
      light.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
      if (lightConfig.target) {
        (light as THREE.SpotLight).target.position.set(
          lightConfig.target.x,
          lightConfig.target.y,
          lightConfig.target.z
        );
        scene.add((light as THREE.SpotLight).target);
      }
      break;
  }

  return light;
}

// 更新单个光源
function updateLight(lightConfig: Light) {
  const existingLight = lightsMap.get(lightConfig.id);
  
  if (!lightConfig.enabled && existingLight) {
    // 如果光源被禁用，移除它
    scene.remove(existingLight);
    existingLight.dispose?.();
    lightsMap.delete(lightConfig.id);
    return;
  }
  
  if (lightConfig.enabled && !existingLight) {
    // 如果光源被启用但不存在，创建它
    const newLight = createLight(lightConfig);
    if (newLight) {
      lightsMap.set(lightConfig.id, newLight);
      scene.add(newLight);
    }
    return;
  }
  
  if (existingLight && lightConfig.enabled) {
    // 更新现有光源
    existingLight.intensity = lightConfig.intensity;
    if (existingLight instanceof THREE.Light && 'color' in existingLight) {
      (existingLight as any).color.set(lightConfig.color);
    }
    
    if ('position' in existingLight && lightConfig.position) {
      existingLight.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
    }
    
    // 更新方向光和聚光灯的目标
    if ((existingLight instanceof THREE.DirectionalLight || existingLight instanceof THREE.SpotLight) && lightConfig.target) {
      existingLight.target.position.set(
        lightConfig.target.x,
        lightConfig.target.y,
        lightConfig.target.z
      );
    }
    
    // 更新聚光灯特有属性
    if (existingLight instanceof THREE.SpotLight) {
      if (lightConfig.angle !== undefined) existingLight.angle = lightConfig.angle;
      if (lightConfig.penumbra !== undefined) existingLight.penumbra = lightConfig.penumbra;
      if (lightConfig.decay !== undefined) existingLight.decay = lightConfig.decay;
      if (lightConfig.distance !== undefined) existingLight.distance = lightConfig.distance;
    }
    
    // 更新点光源特有属性
    if (existingLight instanceof THREE.PointLight) {
      if (lightConfig.decay !== undefined) existingLight.decay = lightConfig.decay;
      if (lightConfig.distance !== undefined) existingLight.distance = lightConfig.distance;
    }
  }
}

// 设置窗口通信事件监听
async function setupEventListeners() {
  // 初始化配置同步
  await modelConfigStore.initConfigSync();

  // 光源配置变更
  const unlistenLight = await windowComm.onConfigUpdate(ModelConfigEvents.LIGHTS_CHANGED, (config) => {
    // 重新创建所有光源
    createLightsFromConfig();
  });
  unlistenFunctions.push(unlistenLight);

  // 相机配置变更
  const unlistenCamera = await windowComm.onConfigUpdate(ModelConfigEvents.CAMERA_CHANGED, (config) => {
    if (camera) {
      camera.fov = Number(config.cameraFov);
      camera.position.z = Number(config.cameraDistance);
      camera.updateProjectionMatrix();
    }
  });
  unlistenFunctions.push(unlistenCamera);

  // 背景配置变更
  const unlistenBackground = await windowComm.onConfigUpdate(ModelConfigEvents.BACKGROUND_CHANGED, (config) => {
    if (scene && renderer) {
      if (config.backgroundColor === "transparent") {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
      } else {
        scene.background = new THREE.Color(config.backgroundColor);
        renderer.setClearColor(new THREE.Color(config.backgroundColor), 1);
      }
    }
  });
  unlistenFunctions.push(unlistenBackground);

  // 模型配置变更
  const unlistenModel = await windowComm.onConfigUpdate(ModelConfigEvents.MODEL_CHANGED, (config) => {
    updateModelFromConfig();
  });
  unlistenFunctions.push(unlistenModel);

  // 旋转速度变更
  const unlistenRotation = await windowComm.onConfigUpdate(ModelConfigEvents.ROTATION_CHANGED, (config) => {
    modelManager.setRotationSpeed(Number(config.rotationSpeed));
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
