<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref } from "vue";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { Window } from "@tauri-apps/api/window";
  import { ModelManager } from "./components/ModelManager";

  const container = ref<HTMLDivElement | null>(null);
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let animationFrameId: number;
  let isDragging = false;
  let isRotating = false;
  let previousMousePosition = { x: 0, y: 0 };
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
          scale: 0.5,
          position: new THREE.Vector3(0, 0, 0),
        },
        autoRotate: true,
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
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
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
  }

  async function loadModels() {
    try {
      for (const modelEntry of modelConfigs) {
        await modelManager.loadModel(modelEntry.id, modelEntry.config);
        console.log(`模型 ${modelEntry.id} 加载成功`);

        // 如果需要可以在这里对特定模型进行额外处理
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

  function onMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      // 左键
      isDragging = true;
      // 使用Tauri API开始拖动窗口
      appWindow.startDragging();
    } else if (e.button === 2) {
      // 右键
      isRotating = true;
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (isRotating) {
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      // 获取主模型并旋转
      const model = modelManager.getModel("heli");
      if (model && model.object) {
        model.object.rotation.y += deltaMove.x * 0.01;
        model.object.rotation.x += deltaMove.y * 0.01;
      }

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }

  function onMouseUp() {
    isDragging = false;
    isRotating = false;
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault(); // 阻止右键菜单弹出
  }

  function onWindowResize() {
    if (!container.value) return;

    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  }

  onMounted(() => {
    init();
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("contextmenu", onContextMenu);

    cancelAnimationFrame(animationFrameId);
    if (renderer) {
      renderer.dispose();
    }
  });
</script>

<template>
  <div ref="container" class="model-container"></div>
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

  .model-container {
    width: 100%;
    height: 100%;
    cursor: pointer;
    position: fixed;
    top: 0;
    left: 0;
  }

  /* 确保所有元素都是透明的 */
  html,
  body,
  #app,
  .model-container {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
</style>
