import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface ModelLoadOptions {
  scale?: THREE.Vector3 | number;
  position?: THREE.Vector3;
  onProgress?: (event: ProgressEvent) => void;
}

export interface ModelConfig {
  path: string;
  options?: ModelLoadOptions;
  autoRotate?: boolean;
  floatAnimation?: boolean;
}

export interface LoadedModel {
  object: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  animations?: THREE.AnimationClip[];
  config?: ModelConfig;
}

export class ModelLoader {
  private loader: GLTFLoader;
  
  constructor() {
    this.loader = new GLTFLoader();
  }
  
  async load(
    modelPath: string, 
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          console.log(`模型 ${modelPath} 加载成功`, gltf);
          const model = gltf.scene;
          
          // 应用缩放
          if (options.scale !== undefined) {
            if (typeof options.scale === 'number') {
              model.scale.set(options.scale, options.scale, options.scale);
            } else {
              model.scale.copy(options.scale);
            }
          }
          
          // 应用位置
          if (options.position) {
            model.position.copy(options.position);
          }
          
          // 创建动画混合器（如果模型有动画）
          let mixer: THREE.AnimationMixer | undefined;
          if (gltf.animations && gltf.animations.length > 0) {
            console.log(`模型 ${modelPath} 动画数量:`, gltf.animations.length);
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
          }
          
          resolve({
            object: model,
            mixer,
            animations: gltf.animations
          });
        },
        options.onProgress,
        (error) => {
          console.error(`模型 ${modelPath} 加载错误:`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * 计算模型的包围盒和中心点
   */
  static computeBoundingBox(model: THREE.Object3D): {
    box: THREE.Box3;
    size: THREE.Vector3;
    center: THREE.Vector3;
  } {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    return { box, size, center };
  }
  
  /**
   * 计算适合展示模型的相机位置
   */
  static computeCameraPosition(
    model: THREE.Object3D,
    cameraFactor: number = 1.5
  ): {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
  } {
    const { size, center } = this.computeBoundingBox(model);
    
    // 找出模型的最大尺寸
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // 计算相机位置
    const position = new THREE.Vector3(
      center.x,
      center.y,
      center.z + maxDim * cameraFactor
    );
    
    return {
      position,
      lookAt: center
    };
  }
} 