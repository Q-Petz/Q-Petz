import type { Window } from "@tauri-apps/api/window";
import type * as THREE from "three";
import { type Ref, onBeforeUnmount } from "vue";
import type { ModelManager } from "../components/ModelManager";

export function useModelEvents(
  container: Ref<HTMLDivElement | null>,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  modelManager: ModelManager,
  appWindow: Window
) {
  let isDragging = false;
  let isRotating = false;
  let previousMousePosition = { x: 0, y: 0 };

  function onWindowResize() {
    if (!container.value) return;

    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
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

  // 添加事件监听
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("contextmenu", onContextMenu);

  // 组件卸载时清理事件监听
  onBeforeUnmount(() => {
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("contextmenu", onContextMenu);
  });

  return {
    onWindowResize,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onContextMenu,
  };
}
