import * as THREE from "three";
import { ModelLoader, LoadedModel, ModelLoadOptions, ModelConfig } from "./ModelLoader";

export class ModelManager {
  private scene: THREE.Scene;
  private modelLoader: ModelLoader;
  private loadedModels: Map<string, LoadedModel> = new Map();
  private clock: THREE.Clock;
  private rotationSpeed = 0.003; // 默认旋转速度
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.modelLoader = new ModelLoader();
    this.clock = new THREE.Clock();
  }
  
  /**
   * 加载模型
   */
  async loadModel(id: string, config: ModelConfig): Promise<LoadedModel> {
    try {
      const loadedModel = await this.modelLoader.load(config.path, config.options || {});
      
      // 将模型添加到场景
      this.scene.add(loadedModel.object);
      
      // 保存模型引用和配置
      loadedModel.config = config;
      this.loadedModels.set(id, loadedModel);
      
      return loadedModel;
    } catch (error) {
      console.error(`加载模型 ${id} 失败:`, error);
      throw error;
    }
  }
  
  /**
   * 获取已加载的模型
   */
  getModel(id: string): LoadedModel | undefined {
    return this.loadedModels.get(id);
  }
  
  /**
   * 更新所有模型动画
   */
  update() {
    const delta = this.clock.getDelta();
    
    for (const [id, model] of this.loadedModels.entries()) {
      // 更新动画混合器
      if (model.mixer) {
        model.mixer.update(delta);
      }
      
      const config = model.config;
      
      // 应用自动旋转
      if (config?.autoRotate && model.object) {
        model.object.rotation.y += this.rotationSpeed;
      }
      
      // 应用浮动动画 - 减小幅度并保持Y轴基础位置
      if (config?.floatAnimation && model.object) {
        // 保存原始Y位置
        if (model.object.userData.originalY === undefined) {
          model.object.userData.originalY = model.object.position.y;
        }
        
        // 小幅度浮动，不会改变整体位置
        const originalY = model.object.userData.originalY;
        model.object.position.y = originalY + Math.sin(this.clock.getElapsedTime() * 0.5) * 0.05;
      }
    }
  }
  
  /**
   * 设置自动旋转速度
   */
  setRotationSpeed(speed: number) {
    this.rotationSpeed = Number(speed);
  }
  
  /**
   * 从场景中移除模型
   */
  removeModel(id: string) {
    const model = this.loadedModels.get(id);
    if (model) {
      this.scene.remove(model.object);
      this.loadedModels.delete(id);
    }
  }
  
  /**
   * 清除所有模型
   */
  clearAll() {
    for (const [id, model] of this.loadedModels.entries()) {
      this.scene.remove(model.object);
    }
    this.loadedModels.clear();
  }
  
  /**
   * 设置模型位置
   */
  setModelPosition(id: string, position: THREE.Vector3) {
    const model = this.loadedModels.get(id);
    if (model && model.object) {
      model.object.position.copy(position);
    }
  }
  
  /**
   * 设置模型旋转
   */
  setModelRotation(id: string, rotation: THREE.Euler) {
    const model = this.loadedModels.get(id);
    if (model && model.object) {
      model.object.rotation.copy(rotation);
    }
  }
  
  /**
   * 设置模型缩放
   */
  setModelScale(id: string, scale: THREE.Vector3 | number) {
    const model = this.loadedModels.get(id);
    if (model && model.object) {
      if (typeof scale === 'number') {
        const scaleFactor = Number(scale);
        model.object.scale.set(scaleFactor, scaleFactor, scaleFactor);
      } else {
        model.object.scale.copy(scale);
      }
    }
  }
  
  /**
   * 更新模型配置
   */
  updateModelConfig(id: string, config: Partial<ModelConfig>) {
    const model = this.loadedModels.get(id);
    if (model && model.config) {
      // 更新配置
      if (config.autoRotate !== undefined) {
        model.config.autoRotate = Boolean(config.autoRotate);
      }
      
      if (config.floatAnimation !== undefined) {
        model.config.floatAnimation = Boolean(config.floatAnimation);
      }
      
      if (config.options) {
        if (!model.config.options) {
          model.config.options = {};
        }
        
        // 将配置合并并强制转换类型
        if (config.options.scale !== undefined) {
          if (!model.config.options) model.config.options = {};
          model.config.options.scale = Number(config.options.scale);
          this.setModelScale(id, Number(config.options.scale));
        }
        
        // 应用新的位置
        if (config.options.position) {
          if (!model.config.options) model.config.options = {};
          if (!model.config.options.position) {
            model.config.options.position = new THREE.Vector3();
          }
          
          if (config.options.position instanceof THREE.Vector3) {
            model.config.options.position.copy(config.options.position);
          } else if (typeof config.options.position === 'object') {
            // 确保position是一个具有x,y,z属性的对象
            const pos = config.options.position as {x?: number, y?: number, z?: number};
            model.config.options.position.set(
              Number(pos.x || 0),
              Number(pos.y || 0),
              Number(pos.z || 0)
            );
          }
          
          this.setModelPosition(id, model.config.options.position);
        }
        
        // 应用新的旋转
        if (config.options.rotation) {
          if (!model.config.options) model.config.options = {};
          model.config.options.rotation = config.options.rotation;
          this.setModelRotation(id, config.options.rotation);
        }
      }
    }
  }
} 