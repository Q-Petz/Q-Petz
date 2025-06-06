import { emit, listen } from "@tauri-apps/api/event";
import { defineStore } from "pinia";
import * as THREE from "three";

export interface ModelConfigState {
  // 光源配置
  lightIntensity: number;
  lightColor: string;
  lightPosition: {
    x: number;
    y: number;
    z: number;
  };

  // 模型配置
  modelScale: number;
  modelAutoRotate: boolean;
  modelFloatAnimation: boolean;

  // 相机配置
  cameraDistance: number;
  cameraFov: number;

  // 背景配置
  backgroundColor: string;

  // 动画配置
  rotationSpeed: number;
}

// Tauri IPC事件名称常量
export const TauriEvents = {
  LIGHT_CHANGED: "model-config:light-changed",
  MODEL_CHANGED: "model-config:model-changed",
  CAMERA_CHANGED: "model-config:camera-changed",
  BACKGROUND_CHANGED: "model-config:background-changed",
  ROTATION_CHANGED: "model-config:rotation-changed",
  CONFIG_CHANGED: "model-config:config-changed",
};

export const useModelConfigStore = defineStore("modelConfig", {
  state: (): ModelConfigState => ({
    // 光源配置
    lightIntensity: 2.0,
    lightColor: "#ffffff",
    lightPosition: {
      x: 1,
      y: 1,
      z: 1,
    },

    // 模型配置
    modelScale: 3.0,
    modelAutoRotate: false,
    modelFloatAnimation: true,

    // 相机配置
    cameraDistance: 5,
    cameraFov: 45,

    // 背景配置
    backgroundColor: "transparent",

    // 动画配置
    rotationSpeed: 0.003,
  }),

  actions: {
    updateLightConfig(
      config: Partial<Pick<ModelConfigState, "lightIntensity" | "lightColor" | "lightPosition">>
    ) {
      if (config.lightIntensity !== undefined) {
        this.lightIntensity = Number(config.lightIntensity);
      }
      if (config.lightColor !== undefined) {
        this.lightColor = config.lightColor;
      }
      if (config.lightPosition !== undefined) {
        this.lightPosition = {
          x: Number(config.lightPosition.x),
          y: Number(config.lightPosition.y),
          z: Number(config.lightPosition.z),
        };
      }

      // 使用Tauri IPC发送事件
      emit(TauriEvents.LIGHT_CHANGED, {
        lightIntensity: this.lightIntensity,
        lightColor: this.lightColor,
        lightPosition: this.lightPosition,
      });
    },

    updateModelConfig(
      config: Partial<
        Pick<ModelConfigState, "modelScale" | "modelAutoRotate" | "modelFloatAnimation">
      >
    ) {
      if (config.modelScale !== undefined) {
        this.modelScale = Number(config.modelScale);
      }
      if (config.modelAutoRotate !== undefined) {
        this.modelAutoRotate = Boolean(config.modelAutoRotate);
      }
      if (config.modelFloatAnimation !== undefined) {
        this.modelFloatAnimation = Boolean(config.modelFloatAnimation);
      }

      // 使用Tauri IPC发送事件
      emit(TauriEvents.MODEL_CHANGED, {
        modelScale: this.modelScale,
        modelAutoRotate: this.modelAutoRotate,
        modelFloatAnimation: this.modelFloatAnimation,
      });
    },

    updateCameraConfig(config: Partial<Pick<ModelConfigState, "cameraDistance" | "cameraFov">>) {
      if (config.cameraDistance !== undefined) {
        this.cameraDistance = Number(config.cameraDistance);
      }
      if (config.cameraFov !== undefined) {
        this.cameraFov = Number(config.cameraFov);
      }

      // 使用Tauri IPC发送事件
      emit(TauriEvents.CAMERA_CHANGED, {
        cameraDistance: this.cameraDistance,
        cameraFov: this.cameraFov,
      });
    },

    updateBackgroundConfig(backgroundColor: string) {
      this.backgroundColor = backgroundColor;

      // 使用Tauri IPC发送事件
      emit(TauriEvents.BACKGROUND_CHANGED, {
        backgroundColor: this.backgroundColor,
      });
    },

    updateRotationSpeed(speed: number) {
      this.rotationSpeed = Number(speed);

      // 使用Tauri IPC发送事件
      emit(TauriEvents.ROTATION_CHANGED, {
        rotationSpeed: this.rotationSpeed,
      });
    },

    // 应用当前配置到本地存储
    saveToLocalStorage() {
      localStorage.setItem(
        "modelConfig",
        JSON.stringify({
          lightIntensity: Number(this.lightIntensity),
          lightColor: this.lightColor,
          lightPosition: {
            x: Number(this.lightPosition.x),
            y: Number(this.lightPosition.y),
            z: Number(this.lightPosition.z),
          },
          modelScale: Number(this.modelScale),
          modelAutoRotate: Boolean(this.modelAutoRotate),
          modelFloatAnimation: Boolean(this.modelFloatAnimation),
          cameraDistance: Number(this.cameraDistance),
          cameraFov: Number(this.cameraFov),
          backgroundColor: this.backgroundColor,
          rotationSpeed: Number(this.rotationSpeed),
        })
      );

      // 使用Tauri IPC发送配置更改事件
      emit(TauriEvents.CONFIG_CHANGED, this.$state);
    },

    // 从本地存储加载配置
    loadFromLocalStorage() {
      const savedConfig = localStorage.getItem("modelConfig");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);

          // 确保所有数值类型正确
          if (config.lightIntensity !== undefined)
            config.lightIntensity = Number(config.lightIntensity);
          if (config.lightPosition) {
            if (config.lightPosition.x !== undefined)
              config.lightPosition.x = Number(config.lightPosition.x);
            if (config.lightPosition.y !== undefined)
              config.lightPosition.y = Number(config.lightPosition.y);
            if (config.lightPosition.z !== undefined)
              config.lightPosition.z = Number(config.lightPosition.z);
          }
          if (config.modelScale !== undefined) config.modelScale = Number(config.modelScale);
          if (config.modelAutoRotate !== undefined)
            config.modelAutoRotate = Boolean(config.modelAutoRotate);
          if (config.modelFloatAnimation !== undefined)
            config.modelFloatAnimation = Boolean(config.modelFloatAnimation);
          if (config.cameraDistance !== undefined)
            config.cameraDistance = Number(config.cameraDistance);
          if (config.cameraFov !== undefined) config.cameraFov = Number(config.cameraFov);
          if (config.rotationSpeed !== undefined)
            config.rotationSpeed = Number(config.rotationSpeed);

          this.$patch(config);

          // 使用Tauri IPC发送配置更改事件
          emit(TauriEvents.CONFIG_CHANGED, this.$state);
        } catch (e) {
          console.error("加载配置失败", e);
        }
      }
    },

    // 重置为默认配置
    resetToDefaults() {
      this.$reset();

      // 使用Tauri IPC发送配置更改事件
      emit(TauriEvents.CONFIG_CHANGED, this.$state);
    },
  },

  getters: {
    // 获取THREE.js格式的颜色
    lightColorObj(): THREE.Color {
      return new THREE.Color(this.lightColor);
    },

    // 获取THREE.js格式的位置向量
    lightPositionVector(): THREE.Vector3 {
      return new THREE.Vector3(
        Number(this.lightPosition.x),
        Number(this.lightPosition.y),
        Number(this.lightPosition.z)
      );
    },
  },
});
