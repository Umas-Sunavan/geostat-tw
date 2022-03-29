import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, of } from 'rxjs';
import { BoxGeometry, Camera, Color, DirectionalLight, Intersection, Mesh, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Raycaster, Renderer, RepeatWrapping, Scene, ShaderMaterial, Texture, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Injectable({
  providedIn: 'root'
})
export class AnimateService {

  onFrameRender!: BehaviorSubject<{ renderer: WebGLRenderer, raycaster: Raycaster }>
  onMouseIntersect: BehaviorSubject<Intersection<Object3D<Event>>[]> = new BehaviorSubject([] as Intersection<Object3D<Event>>[])
  onCanvasIntersect: BehaviorSubject<Intersection<Object3D<Event>>[]> = new BehaviorSubject([] as Intersection<Object3D<Event>>[])
  mouseRaycaster = new Raycaster();
  cavasCenterRaycaster = new Raycaster()
  intersectedObjs: Object3D[] = []
  mouse?: Vector2

  constructor(
  ) {
  }


  animate = (renderer: WebGLRenderer, scene: Scene, camera: Camera, orbitControl: OrbitControls, mouse: Vector2, frameMax: number = 3600) => {
    if (renderer.info.render.frame > frameMax) return
    this.mouseRaycaster.setFromCamera(mouse, camera);
    
    this.cavasCenterRaycaster.setFromCamera(new Vector2(0,0), camera);
    requestAnimationFrame(() => {
      this.animate(renderer, scene, camera, orbitControl, mouse)
      this.onFrameRender.next({ renderer: renderer, raycaster: this.mouseRaycaster })
    });

    renderer.render(scene, camera);

    // orbitControl.update()
    this.onIntersections()
  }

  onIntersections = () => {
    const intersects:Intersection<Object3D<Event>>[] = this.mouseRaycaster.intersectObjects(this.intersectedObjs)
    this.onMouseIntersect.next(intersects)    
    const canvasCenterIntersects:Intersection<Object3D<Event>>[] = this.cavasCenterRaycaster.intersectObjects(this.intersectedObjs)
    this.onCanvasIntersect.next(canvasCenterIntersects)    
  }

  onIntersection = (intersect: Intersection, obj: Object3D) => {
    console.log(intersect.point.toArray());
    
  }

  initAnimate = (renderer: WebGLRenderer) => {
    this.onFrameRender = new BehaviorSubject({ renderer: renderer, raycaster: this.mouseRaycaster })
  }

  passIntersetObject = (objects: Object3D[]) => {
    this.intersectedObjs = objects
  }

  updateMouse = (mouse: Vector2) => {
    this.mouse = mouse
  }

  getCanvasCenter = (): Vector3 | undefined => this.onCanvasIntersect.value[0]?.point

  
}
