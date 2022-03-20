import { Injectable } from '@angular/core';
import { PointLight, PointLightHelper, Scene } from 'three';

@Injectable({
  providedIn: 'root'
})
export class LightService {

  constructor() { }

  makeLight = (scene: Scene) => {
    const light = new PointLight(0xffffff, 2.0)
    light.position.set(0, 10, 10)
    const pointLightHelper = new PointLightHelper(light, 5, 0x000000)
    scene.add(light)
    scene.add(pointLightHelper)
  }
}
