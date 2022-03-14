import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, of } from 'rxjs';
import { Camera, Color, Intersection, Mesh, MeshStandardMaterial, Object3D, Raycaster, Renderer, Scene, Vector2, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Injectable({
  providedIn: 'root'
})
export class AnimateService {

  onFrameRender!: BehaviorSubject<{ renderer: WebGLRenderer, raycaster: Raycaster }>
  raycaster = new Raycaster();
  intersectedObjs: Object3D[] = []
  mouse?: Vector2

  constructor(
  ) {}


  animate = (renderer: WebGLRenderer, scene: Scene, camera: Camera, orbitControl: OrbitControls, mouse: Vector2, frameMax: number = 1200) => {
    // if (renderer.info.render.frame > frameMax) return    
    this.raycaster.setFromCamera(mouse, camera);
    requestAnimationFrame(() => {
      this.animate(renderer, scene, camera, orbitControl, mouse)
      this.onFrameRender.next({ renderer: renderer, raycaster: this.raycaster })
    });
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

}
