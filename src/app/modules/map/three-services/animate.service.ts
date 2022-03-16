import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, of } from 'rxjs';
import { BoxGeometry, Camera, Color, DirectionalLight, Intersection, Mesh, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Raycaster, Renderer, RepeatWrapping, Scene, ShaderMaterial, Texture, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Injectable({
  providedIn: 'root'
})
export class AnimateService {

  onFrameRender!: BehaviorSubject<{ renderer: WebGLRenderer, raycaster: Raycaster }>
  raycaster = new Raycaster();
  intersectedObjs: Object3D[] = []
  mouse?: Vector2

  renderTarget: WebGLRenderTarget = new WebGLRenderTarget(512, 512);
  renderTargetScene: Scene = new Scene;
  renderTargetCamera: PerspectiveCamera = new PerspectiveCamera();
  shaderPlane?: Mesh;

  constructor(
  ) {
    this.renderTargetScene = this.initTargetScene()
    this.renderTargetCamera = this.initTargetCamera()
  }


  animate = (renderer: WebGLRenderer, scene: Scene, camera: Camera, orbitControl: OrbitControls, mouse: Vector2, frameMax: number = 1200) => {
    if (renderer.info.render.frame > frameMax) return
    this.raycaster.setFromCamera(mouse, camera);
    requestAnimationFrame(() => {
      this.animate(renderer, scene, camera, orbitControl, mouse)
      this.onFrameRender.next({ renderer: renderer, raycaster: this.raycaster })
    });

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.renderTargetScene, this.renderTargetCamera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // orbitControl.update()
    this.onIntersections()
  }

  onIntersections = () => {
    this.intersectedObjs.forEach((obj: Object3D) => {
      const intersects = this.raycaster.intersectObject(obj)
      intersects.forEach(intersect => {
        this.onIntersection(intersect, obj)
      })
    })
  }

  onIntersection = (intersect: Intersection, obj: Object3D) => {
  }

  initAnimate = (renderer: WebGLRenderer) => {
    this.onFrameRender = new BehaviorSubject({ renderer: renderer, raycaster: this.raycaster })
  }

  passIntersetObject = (objects: Object3D[]) => {
    console.log(objects);
    this.intersectedObjs = objects
  }

  updateMouse = (mouse: Vector2) => {
    this.mouse = mouse
  }

  initTargetCamera = () => {
    const rtWidth = 512;
    const rtHeight = 512;
    const rtFov = 75;
    const rtAspect = rtWidth / rtHeight;
    const rtNear = 0.1;
    const rtFar = 5;
    const rtCamera = new PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
    rtCamera.position.z = 2;
    return rtCamera
  }

  initTargetScene = () => {

    const rtScene = new Scene();
    rtScene.background = new Color('red');

    {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      rtScene.add(light);
    }

    const material = new MeshPhongMaterial({ color: 0xFFFF00 });
    const geometry = new BoxGeometry(1, 1, 1);
    const cube = new Mesh(geometry, material);
    // rtScene.add(cube);

    return rtScene
  }

  initShaderMaterial = (texture: Texture, vertext?: string, fragment?:string) => {

    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    const uniforms = {
      'amplitude': { value: 1.0 },
      'color': { value: new Color( 0xffffff ) },
      'colorTexture': { value: texture }
    };
    if (!vertext || !fragment) throw new Error("")
    const shaderMaterial = new ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertext,
      fragmentShader: fragment
    } );
    const planeGeo = new PlaneGeometry( 1, 1, 1, 1)
    this.shaderPlane = new Mesh( planeGeo, shaderMaterial );
    this.shaderPlane.position.z = 0.35
    this.renderTargetScene.add(this.shaderPlane)
  }
  
}
