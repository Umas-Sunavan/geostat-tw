import { Injectable } from '@angular/core';
import { OrthographicCamera, PerspectiveCamera, Scene, Vector2 } from 'three';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor() { }

  defaultCameraPosition = [20.19, 10.82, 44.58] as const

  makeCamera = (dimention: Vector2) => {
    const camera = new PerspectiveCamera(45, dimention.x / dimention.y, 0.01, 1000)
    camera.position.set(...this.defaultCameraPosition)
    return camera
    
  }

  makeOrthographicCamera = (w:number = 600, h: number = 450) => {
    const camera = new OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, 1, 1000 );
    camera.position.set(80, 80, 80)
    return camera
    
  }
}
