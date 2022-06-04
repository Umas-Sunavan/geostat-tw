import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AmbientLight, CameraHelper, DirectionalLight, DirectionalLightHelper, HemisphereLight, PointLight, PointLightHelper, Scene } from 'three';

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
    const light = new DirectionalLight(0xffffff,0.1)
    const lightHelper = new DirectionalLightHelper(light, 10)

    const shadowHelper = new CameraHelper(light.shadow.camera);
    // light.castShadow = true
    light.position.set(35, 40, 20)
    light.shadow.camera.bottom = -20
    light.shadow.camera.top = 10
    light.shadow.camera.left = -20
    light.shadow.camera.right = 20
    
    light.target.position.set(20, 10, 30)
    scene.add(light)
    if (!environment.production) {
      scene.add(lightHelper)
      scene.add(shadowHelper)
    }
      
    // update the light target's matrixWorld because it's needed by the helper
    light.target.updateMatrixWorld();
    lightHelper.update();
    light.shadow.camera.updateProjectionMatrix();
    shadowHelper.update();
  }

  makeAmbientLight = (scene: Scene) => {
    const light = new AmbientLight(0xffffff, 0.9)
    light.position.set(0, 20, 10)
    scene.add(light)
  }
}
