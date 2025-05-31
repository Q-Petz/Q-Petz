import * as THREE from "three";
import { ModelLoader, LoadedModel, ModelLoadOptions, ModelConfig } from "./ModelLoader";

export class ModelManager {
  private scene: THREE.Scene;
  private modelLoader: ModelLoader;
  private loadedModels: Map<string, LoadedModel> = new Map();
  private clock: THREE.Clock;
  
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
        model.object.rotation.y += 0.003;
      }
      
      // 应用浮动动画
      if (config?.floatAnimation && model.object) {
        model.object.position.y = Math.sin(this.clock.getElapsedTime() * 0.5) * 0.1;
      }
    }
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
        model.object.scale.set(scale, scale, scale);
      } else {
        model.object.scale.copy(scale);
      }
    }
  }
} 