import { Injectable } from '@angular/core';
import { AmbientLight, HemisphereLight, PointLight, PointLightHelper, Scene } from 'three';

@Injectable({
  providedIn: 'root'
})
export class LightService {

  constructor() { }

  makeLight = (scene: Scene) => {
    this.makeAmbientLight(scene)
    this.makePointLight(scene)
  }

  makePointLight = (scene: Scene) => {
    const light = new PointLight(0xffffff, 0.5)
    light.position.set(40, 20, 10)
    const pointLightHelper = new PointLightHelper(light, 5, 0x000000)
    // scene.add(light)
    // scene.add(pointLightHelper)
    const dLight = new DirectionalLight(0xffffff,0.1)
    const dLightHelper = new DirectionalLightHelper(dLight, 10)

    const cameraHelper = new CameraHelper(dLight.shadow.camera);
    scene.add(cameraHelper)
    dLight.castShadow = true
    dLight.position.set(35, 40, 20)
    dLight.shadow.camera.bottom = -20
    dLight.shadow.camera.top = 10
    dLight.shadow.camera.left = -20
    dLight.shadow.camera.right = 20
    
    dLight.target.position.set(20, 10, 30)
    scene.add(dLight)
    scene.add(dLightHelper)
      
    // update the light target's matrixWorld because it's needed by the helper
    dLight.target.updateMatrixWorld();
    dLightHelper.update();
    dLight.shadow.camera.updateProjectionMatrix();
    cameraHelper.update();
  }

  makeAmbientLight = (scene: Scene) => {
    const light = new AmbientLight(0xffffff, 0.9)
    light.position.set(0, 20, 10)
    scene.add(light)
  }
}
