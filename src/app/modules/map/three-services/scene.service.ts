import { Injectable } from '@angular/core';
import { Scene, Color } from 'three';
@Injectable({
  providedIn: 'root'
})
export class SceneService {

  constructor() { }

  makeScene = () => {
    const scene = new Scene()
    scene.background = new Color(0x999999)
    return scene
  }
}
