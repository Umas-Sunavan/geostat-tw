import { Injectable } from '@angular/core';
import { OrthographicCamera, PerspectiveCamera, Scene } from 'three';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor() { }

  makeCamera = (w:number = 600, h: number = 450) => {
    const camera = new PerspectiveCamera(45, w / h, 1, 1000)
    camera.position.set(80, 80, 80)
    return camera
    
  }

  makeOrthographicCamera = (w:number = 600, h: number = 450) => {
    const camera = new OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, 1, 1000 );
    camera.position.set(80, 80, 80)
    return camera
    
  }
}
