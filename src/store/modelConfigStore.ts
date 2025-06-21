import { defineStore } from "pinia";
import * as THREE from "three";
import { windowComm, CONFIG_EVENTS } from "@/utils/window-communication";

export enum LightType {
  AMBIENT = "ambient",
  DIRECTIONAL = "directional",
  POINT = "point",
  SPOT = "spot",
}

export interface Light {
  id: string;
  type: LightType;
  name: string;
  intensity: number;
  color: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  // 方向光特有属性
  target?: {
    x: number;
    y: number;
    z: number;
  };
  // 聚光灯特有属性
  angle?: number;
  penumbra?: number;
  decay?: number;
  distance?: number;
  // 是否启用
  enabled: boolean;
}

export interface ModelConfigState {
  // 光源配置（支持多光源）
  lights: Light[];

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

// 配置变更事件处理器
export const ModelConfigEvents = {
  LIGHTS_CHANGED: CONFIG_EVENTS.LIGHT_UPDATE,
  MODEL_CHANGED: CONFIG_EVENTS.MODEL_UPDATE,
  CAMERA_CHANGED: CONFIG_EVENTS.CAMERA_UPDATE,
  BACKGROUND_CHANGED: CONFIG_EVENTS.BACKGROUND_UPDATE,
  ROTATION_CHANGED: CONFIG_EVENTS.ANIMATION_UPDATE,
  CONFIG_CHANGED: CONFIG_EVENTS.FULL_CONFIG_SYNC,
};

// 默认光源配置
const createDefaultLights = (): Light[] => [
  {
    id: "ambient-1",
    type: LightType.AMBIENT,
    name: "环境光",
    intensity: 0.4,
    color: "#ffffff",
    position: { x: 0, y: 0, z: 0 },
    enabled: true,
  },
  {
    id: "directional-1",
    type: LightType.DIRECTIONAL,
    name: "主光源",
    intensity: 1.6,
    color: "#ffffff",
    position: { x: 1, y: 1, z: 1 },
    target: { x: 0, y: 0, z: 0 },
    enabled: true,
  },
];

export const useModelConfigStore = defineStore("modelConfig", {
  state: (): ModelConfigState => ({
    // 光源配置
    lights: createDefaultLights(),

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
    // 添加新光源
    addLight(lightType: LightType) {
      const newLight: Light = {
        id: `${lightType}-${Date.now()}`,
        type: lightType,
        name: this.getDefaultLightName(lightType),
        intensity: 1.0,
        color: "#ffffff",
        position: { x: 1, y: 1, z: 1 },
        enabled: true,
      };

      // 根据光源类型设置默认属性
      switch (lightType) {
        case LightType.DIRECTIONAL:
          newLight.target = { x: 0, y: 0, z: 0 };
          break;
        case LightType.SPOT:
          newLight.target = { x: 0, y: 0, z: 0 };
          newLight.angle = Math.PI / 4;
          newLight.penumbra = 0.1;
          newLight.decay = 2;
          newLight.distance = 0;
          break;
        case LightType.POINT:
          newLight.decay = 2;
          newLight.distance = 0;
          break;
      }

      this.lights.push(newLight);
      this.broadcastLightsUpdate();
    },

    // 删除光源
    removeLight(lightId: string) {
      const index = this.lights.findIndex((light) => light.id === lightId);
      if (index > -1) {
        this.lights.splice(index, 1);
        this.broadcastLightsUpdate();
      }
    },

    // 更新单个光源
    updateLight(lightId: string, updates: Partial<Light>) {
      const light = this.lights.find((l) => l.id === lightId);
      if (light) {
        Object.assign(light, updates);
        this.broadcastLightsUpdate();
      }
    },

    // 更新光源位置
    updateLightPosition(lightId: string, position: { x: number; y: number; z: number }) {
      const light = this.lights.find((l) => l.id === lightId);
      if (light) {
        light.position = {
          x: Number(position.x),
          y: Number(position.y),
          z: Number(position.z),
        };
        this.broadcastLightsUpdate();
      }
    },

    // 更新光源目标（用于方向光和聚光灯）
    updateLightTarget(lightId: string, target: { x: number; y: number; z: number }) {
      const light = this.lights.find((l) => l.id === lightId);
      if (light && (light.type === LightType.DIRECTIONAL || light.type === LightType.SPOT)) {
        light.target = {
          x: Number(target.x),
          y: Number(target.y),
          z: Number(target.z),
        };
        this.broadcastLightsUpdate();
      }
    },

    // 切换光源启用状态
    toggleLight(lightId: string) {
      const light = this.lights.find((l) => l.id === lightId);
      if (light) {
        light.enabled = !light.enabled;
        this.broadcastLightsUpdate();
      }
    },

    // 广播光源更新
    broadcastLightsUpdate() {
      windowComm.broadcastConfig(ModelConfigEvents.LIGHTS_CHANGED, {
        lights: this.lights,
      });
    },

    // 获取默认光源名称
    getDefaultLightName(type: LightType): string {
      const typeNames = {
        [LightType.AMBIENT]: "环境光",
        [LightType.DIRECTIONAL]: "方向光",
        [LightType.POINT]: "点光源",
        [LightType.SPOT]: "聚光灯",
      };
      const baseName = typeNames[type];
      const count = this.lights.filter((l) => l.type === type).length;
      return `${baseName} ${count + 1}`;
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

      // 广播模型配置更新
      windowComm.broadcastConfig(ModelConfigEvents.MODEL_CHANGED, {
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

      // 广播相机配置更新
      windowComm.broadcastConfig(ModelConfigEvents.CAMERA_CHANGED, {
        cameraDistance: this.cameraDistance,
        cameraFov: this.cameraFov,
      });
    },

    updateBackgroundConfig(backgroundColor: string) {
      this.backgroundColor = backgroundColor;

      // 广播背景配置更新
      windowComm.broadcastConfig(ModelConfigEvents.BACKGROUND_CHANGED, {
        backgroundColor: this.backgroundColor,
      });
    },

    updateRotationSpeed(speed: number) {
      this.rotationSpeed = Number(speed);

      // 广播旋转速度配置更新
      windowComm.broadcastConfig(ModelConfigEvents.ROTATION_CHANGED, {
        rotationSpeed: this.rotationSpeed,
      });
    },

    // 应用当前配置到本地存储
    saveToLocalStorage() {
      localStorage.setItem(
        "modelConfig",
        JSON.stringify({
          lights: this.lights,
          modelScale: Number(this.modelScale),
          modelAutoRotate: Boolean(this.modelAutoRotate),
          modelFloatAnimation: Boolean(this.modelFloatAnimation),
          cameraDistance: Number(this.cameraDistance),
          cameraFov: Number(this.cameraFov),
          backgroundColor: this.backgroundColor,
          rotationSpeed: Number(this.rotationSpeed),
        })
      );

      // 广播完整配置更新
      windowComm.broadcastConfig(ModelConfigEvents.CONFIG_CHANGED, this.$state);
    },

    // 从本地存储加载配置
    loadFromLocalStorage() {
      const savedConfig = localStorage.getItem("modelConfig");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);

          // 处理旧版本配置的兼容性
          if (config.lightIntensity !== undefined && !config.lights) {
            // 转换旧配置到新格式
            config.lights = [
              {
                id: "ambient-1",
                type: LightType.AMBIENT,
                name: "环境光",
                intensity: config.lightIntensity * 0.2,
                color: config.lightColor || "#ffffff",
                position: { x: 0, y: 0, z: 0 },
                enabled: true,
              },
              {
                id: "directional-1",
                type: LightType.DIRECTIONAL,
                name: "主光源",
                intensity: config.lightIntensity * 0.8,
                color: config.lightColor || "#ffffff",
                position: config.lightPosition || { x: 1, y: 1, z: 1 },
                target: { x: 0, y: 0, z: 0 },
                enabled: true,
              },
            ];
          }

          // 确保所有数值类型正确
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

          // 广播配置加载完成
          windowComm.broadcastConfig(ModelConfigEvents.CONFIG_CHANGED, this.$state);
        } catch (e) {
          console.error("加载配置失败", e);
        }
      }
    },

    // 重置为默认配置
    resetToDefaults() {
      this.$reset();
      this.lights = createDefaultLights();

      // 广播配置重置
      windowComm.broadcastConfig(ModelConfigEvents.CONFIG_CHANGED, this.$state);
    },

    // 初始化配置同步监听
    async initConfigSync() {
      // 监听光源配置更新
      await windowComm.onConfigUpdate(ModelConfigEvents.LIGHTS_CHANGED, (config) => {
        this.lights = config.lights;
      });

      // 监听模型配置更新
      await windowComm.onConfigUpdate(ModelConfigEvents.MODEL_CHANGED, (config) => {
        this.$patch({
          modelScale: config.modelScale,
          modelAutoRotate: config.modelAutoRotate,
          modelFloatAnimation: config.modelFloatAnimation,
        });
      });

      // 监听相机配置更新
      await windowComm.onConfigUpdate(ModelConfigEvents.CAMERA_CHANGED, (config) => {
        this.$patch({
          cameraDistance: config.cameraDistance,
          cameraFov: config.cameraFov,
        });
      });

      // 监听背景配置更新
      await windowComm.onConfigUpdate(ModelConfigEvents.BACKGROUND_CHANGED, (config) => {
        this.backgroundColor = config.backgroundColor;
      });

      // 监听动画配置更新
      await windowComm.onConfigUpdate(ModelConfigEvents.ROTATION_CHANGED, (config) => {
        this.rotationSpeed = config.rotationSpeed;
      });

      // 监听完整配置同步
      await windowComm.onConfigUpdate(ModelConfigEvents.CONFIG_CHANGED, (config: ModelConfigState) => {
        this.$patch(config);
      });

      // 设置配置请求处理器
      windowComm.onConfigRequest(() => this.$state as ModelConfigState);
    },
  },

  getters: {
    // 获取启用的光源
    enabledLights(): Light[] {
      return this.lights.filter((light) => light.enabled);
    },

    // 获取特定类型的光源
    getLightsByType() {
      return (type: LightType) => this.lights.filter((light) => light.type === type);
    },

    // 获取光源总数
    lightsCount(): number {
      return this.lights.length;
    },
  },
});