<template>
  <div ref="containerRef" class="light-preview-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, PropType } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Light, LightType } from "@/store/modelConfigStore";
import { throttle } from "@/utils/debounce";

const props = defineProps({
  light: {
    type: Object as PropType<Light>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<{ x: number; y: number; z: number }>,
    required: true,
  },
});

const emit = defineEmits<{
  "update:modelValue": [value: { x: number; y: number; z: number }];
  "update:target": [value: { x: number; y: number; z: number }];
}>();

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let lightHelper: THREE.Object3D;
let targetHelper: THREE.Mesh | null = null;
let arrowHelper: THREE.ArrowHelper | null = null;
let animationId: number;

// 光源位置球体
let lightSphere: THREE.Mesh;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false;
let dragTarget: "light" | "target" | null = null;
let dragPlane: "xy" | "xz" | "yz" = "xz"; // 默认在XZ平面拖拽

// 创建节流的emit函数，100ms节流
const throttledEmit = throttle((value: { x: number; y: number; z: number }) => {
  emit("update:modelValue", value);
}, 100);

// 初始化场景
const initScene = () => {
  if (!containerRef.value || !canvasRef.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // 创建相机
  const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.set(5, 5, 5);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  });
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 15;

  // 添加网格
  const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xeeeeee);
  scene.add(gridHelper);

  // 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 创建中心球体（模型占位符）
  const centerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const centerMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888,
    specular: 0x111111,
    shininess: 30,
  });
  const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
  scene.add(centerSphere);

  // 创建光源位置指示器
  createLightIndicator();

  // 更新光源位置
  updateLightPosition();

  // 添加事件监听
  containerRef.value.addEventListener("mousedown", onMouseDown);
  containerRef.value.addEventListener("mousemove", onMouseMove);
  containerRef.value.addEventListener("mouseup", onMouseUp);
  containerRef.value.addEventListener("mouseleave", onMouseUp);
  containerRef.value.addEventListener("wheel", onWheel);

  // 开始渲染
  animate();
};

// 创建光源指示器
const createLightIndicator = () => {
  // 光源位置球体 - 增大尺寸以改善交互
  const sphereGeometry = new THREE.SphereGeometry(0.35, 32, 32);
  const sphereMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(props.light.color),
    emissive: new THREE.Color(props.light.color),
    emissiveIntensity: 0.5,
    specular: 0xffffff,
    shininess: 100,
  });
  lightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  lightSphere.userData.isInteractive = true;
  scene.add(lightSphere);

  // 根据光源类型创建不同的辅助显示
  switch (props.light.type) {
    case LightType.DIRECTIONAL:
      // 创建方向箭头
      const direction = new THREE.Vector3(
        -props.modelValue.x,
        -props.modelValue.y,
        -props.modelValue.z
      ).normalize();
      arrowHelper = new THREE.ArrowHelper(
        direction,
        new THREE.Vector3(props.modelValue.x, props.modelValue.y, props.modelValue.z),
        2,
        new THREE.Color(props.light.color),
        0.6,
        0.4
      );
      scene.add(arrowHelper);

      // 如果有目标点，创建目标指示器
      if (props.light.target) {
        const targetGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const targetMaterial = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.3,
          opacity: 0.8,
          transparent: true,
        });
        targetHelper = new THREE.Mesh(targetGeometry, targetMaterial);
        targetHelper.userData.isInteractive = true;
        targetHelper.position.set(
          props.light.target.x,
          props.light.target.y,
          props.light.target.z
        );
        scene.add(targetHelper);
      }
      break;

    case LightType.POINT:
      // 点光源辅助器
      lightHelper = new THREE.PointLightHelper(
        new THREE.PointLight(new THREE.Color(props.light.color), 1),
        0.3
      );
      lightHelper.position.copy(lightSphere.position);
      scene.add(lightHelper);
      break;

    case LightType.SPOT:
      // 聚光灯辅助器
      const spotLight = new THREE.SpotLight(
        new THREE.Color(props.light.color),
        1,
        props.light.distance || 0,
        props.light.angle || Math.PI / 4,
        props.light.penumbra || 0.1
      );
      lightHelper = new THREE.SpotLightHelper(spotLight);
      scene.add(lightHelper);

      // 添加目标指示器
      if (props.light.target) {
        const targetGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const targetMaterial = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.3,
          opacity: 0.8,
          transparent: true,
        });
        targetHelper = new THREE.Mesh(targetGeometry, targetMaterial);
        targetHelper.userData.isInteractive = true;
        targetHelper.position.set(
          props.light.target.x,
          props.light.target.y,
          props.light.target.z
        );
        scene.add(targetHelper);
      }
      break;
  }
};

// 更新光源位置
const updateLightPosition = () => {
  if (!lightSphere) return;

  lightSphere.position.set(props.modelValue.x, props.modelValue.y, props.modelValue.z);

  // 更新方向箭头
  if (arrowHelper && props.light.type === LightType.DIRECTIONAL) {
    scene.remove(arrowHelper);
    
    const target = props.light.target || { x: 0, y: 0, z: 0 };
    const direction = new THREE.Vector3(
      target.x - props.modelValue.x,
      target.y - props.modelValue.y,
      target.z - props.modelValue.z
    ).normalize();
    
    arrowHelper = new THREE.ArrowHelper(
      direction,
      new THREE.Vector3(props.modelValue.x, props.modelValue.y, props.modelValue.z),
      2,
      new THREE.Color(props.light.color),
      0.6,
      0.4
    );
    scene.add(arrowHelper);
  }

  // 更新其他辅助器
  if (lightHelper) {
    lightHelper.position.copy(lightSphere.position);
    if (lightHelper instanceof THREE.SpotLightHelper && props.light.target) {
      (lightHelper as any).light.target.position.set(
        props.light.target.x,
        props.light.target.y,
        props.light.target.z
      );
      lightHelper.update();
    }
  }
};

// 鼠标事件处理
const onMouseDown = (event: MouseEvent) => {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 检查是否点击了光源球体
  const lightIntersects = raycaster.intersectObject(lightSphere);
  if (lightIntersects.length > 0) {
    isDragging = true;
    dragTarget = "light";
    controls.enabled = false;
    return;
  }

  // 检查是否点击了目标球体
  if (targetHelper) {
    const targetIntersects = raycaster.intersectObject(targetHelper);
    if (targetIntersects.length > 0) {
      isDragging = true;
      dragTarget = "target";
      controls.enabled = false;
      return;
    }
  }
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 根据当前视角选择最佳拖拽平面
  const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
  const absX = Math.abs(cameraDirection.x);
  const absY = Math.abs(cameraDirection.y);
  const absZ = Math.abs(cameraDirection.z);
  
  let plane: THREE.Plane;
  if (absY > absX && absY > absZ) {
    // 主要从上/下看，使用XZ平面
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  } else if (absX > absZ) {
    // 主要从左/右看，使用YZ平面
    plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  } else {
    // 主要从前/后看，使用XY平面
    plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  }
  
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  if (dragTarget === "light") {
    // 限制位置范围
    intersection.x = Math.max(-5, Math.min(5, intersection.x));
    intersection.y = Math.max(-5, Math.min(5, intersection.y));
    intersection.z = Math.max(-5, Math.min(5, intersection.z));

    // 使用节流的emit函数
    throttledEmit({
      x: intersection.x,
      y: intersection.y,
      z: intersection.z,
    });
  } else if (dragTarget === "target" && targetHelper) {
    // 限制目标位置范围
    intersection.x = Math.max(-5, Math.min(5, intersection.x));
    intersection.y = Math.max(-5, Math.min(5, intersection.y));
    intersection.z = Math.max(-5, Math.min(5, intersection.z));
    
    targetHelper.position.copy(intersection);
    // 发出目标位置更新事件
    emit("update:target", {
      x: intersection.x,
      y: intersection.y,
      z: intersection.z,
    });
  }
};

const onMouseUp = () => {
  isDragging = false;
  dragTarget = null;
  controls.enabled = true;
  
  // 当结束拖拽时，如果是目标位置更新，则更新store
  if (dragTarget === "target" && targetHelper && props.light.target) {
    const pos = targetHelper.position;
    emit("update:target", { x: pos.x, y: pos.y, z: pos.z });
  }
};

// 滚轮事件处理 - 调整Y轴高度
const onWheel = (event: WheelEvent) => {
  if (!containerRef.value) return;
  
  const rect = containerRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // 检查是否悬停在光源球体上
  const lightIntersects = raycaster.intersectObject(lightSphere);
  const targetIntersects = targetHelper ? raycaster.intersectObject(targetHelper) : [];
  
  if (lightIntersects.length > 0) {
    event.preventDefault();
    const delta = event.deltaY * 0.001;
    const newY = Math.max(-5, Math.min(5, props.modelValue.y + delta));
    
    throttledEmit({
      x: props.modelValue.x,
      y: newY,
      z: props.modelValue.z,
    });
  } else if (targetIntersects.length > 0 && targetHelper && props.light.target) {
    event.preventDefault();
    const delta = event.deltaY * 0.001;
    const newY = Math.max(-5, Math.min(5, props.light.target.y + delta));
    
    emit("update:target", {
      x: props.light.target.x,
      y: newY,
      z: props.light.target.z,
    });
  }
};

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};

// 处理窗口大小变化
const handleResize = () => {
  if (!containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

// 监听属性变化
watch(() => props.modelValue, updateLightPosition, { deep: true });

watch(
  () => props.light.color,
  (newColor) => {
    if (lightSphere) {
      const material = lightSphere.material as THREE.MeshPhongMaterial;
      material.color.set(newColor);
      material.emissive.set(newColor);
    }
    if (arrowHelper) {
      arrowHelper.setColor(new THREE.Color(newColor));
    }
  }
);

onMounted(() => {
  initScene();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (containerRef.value) {
    containerRef.value.removeEventListener("mousedown", onMouseDown);
    containerRef.value.removeEventListener("mousemove", onMouseMove);
    containerRef.value.removeEventListener("mouseup", onMouseUp);
    containerRef.value.removeEventListener("mouseleave", onMouseUp);
  }
});
</script>

<style scoped>
.light-preview-container {
  width: 100%;
  height: 400px; /* 增加高度以改善交互体验 */
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5;
  cursor: grab;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.light-preview-container:active {
  cursor: grabbing;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>