<template>
  <div ref="container" class="model-container"></div>
</template>

<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, defineComponent } from "vue";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { Window } from "@tauri-apps/api/window";
  import { ModelManager } from "./ModelManager";
  import { useModelEvents } from "../hooks/useModelEvents";

  const container = ref<HTMLDivElement | null>(null);
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let animationFrameId: number;
  let controls: OrbitControls;
  let modelManager: ModelManager;
  let clock: THREE.Clock;
  let appWindow: Window;

  // 可以在这里配置要加载的模型
  const modelConfigs = [
    {
      id: "heli",
      config: {
        path: "/model/heli.glb",
        options: {
          scale: 3,
          position: new THREE.Vector3(0, -1.5, 0), // 将模型向下移动1.5个单位
          rotation: new THREE.Euler(0, -Math.PI / 2, 0), // 旋转不变
        },
        // autoRotate: true,
        floatAnimation: true,
      },
    },
    // 可以添加更多模型配置
    // {
    //   id: "anotherModel",
    //   config: {
    //     path: "/model/another.glb",
    //     options: { scale: 0.3 },
    //     autoRotate: true
    //   }
    // }
  ];

  async function init() {
    if (!container.value) return;

    // 初始化Tauri窗口
    appWindow = Window.getCurrent();

    // 创建场景
    scene = new THREE.Scene();
    scene.background = null; // 透明背景

    // 创建相机
    camera = new THREE.PerspectiveCamera(
      45,
      container.value.clientWidth / container.value.clientHeight,
      0.2,
      1000
    );
    camera.position.set(0, 1, 5); // 调整高度，稍微往上看
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // 确保渲染器背景透明
    });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.setClearColor(0x000000, 0); // 透明背景
    renderer.setPixelRatio(window.devicePixelRatio);
    container.value.appendChild(renderer.domElement);

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 调试用
    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.25;

    // 初始化时钟
    clock = new THREE.Clock();

    // 初始化模型管理器
    modelManager = new ModelManager(scene);

    // 加载配置的模型
    await loadModels();

    // 开始动画循环
    animate();

    // 初始化完成后，设置事件监听
    useModelEvents(container, camera, renderer, modelManager, appWindow);
  }

  async function loadModels() {
    try {
      for (const modelEntry of modelConfigs) {
        const loadedModel = await modelManager.loadModel(
          modelEntry.id,
          modelEntry.config
        );
        console.log(`模型 ${modelEntry.id} 加载成功`);
      }
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

    // 更新控制器
    // if (controls) {
    //   controls.update();
    // }

    // 渲染场景
    renderer.render(scene, camera);
  }

  onMounted(() => {
    init();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
    if (renderer) {
      renderer.dispose();
    }
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
