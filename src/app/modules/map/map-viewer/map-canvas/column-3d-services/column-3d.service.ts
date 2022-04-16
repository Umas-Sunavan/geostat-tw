import { Injectable } from '@angular/core';
import { Gui3dSettings, GuiColumnSettings, GuiGroundSettings } from 'src/app/shared/models/GuiColumnSettings';
import { Pin } from 'src/app/shared/models/Pin';
import { AdditiveBlending, CircleGeometry, Color, CylinderGeometry, DoubleSide, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshPhongMaterial, NormalBlending, SubtractiveBlending } from 'three';

@Injectable({
  providedIn: 'root'
})
export class Column3dService {

  constructor() { }
  

  createColumn3dLayers = (pin: Pin, settings: Gui3dSettings) => {
    const group = new Group();
    const origionalMesh = this.getColumn3d(pin, NormalBlending, `column_${pin.id}_normalBlending`, settings.column)
    // const lightingMesh = this.getColumn3d(pin, AdditiveBlending, `column_${pin.id}_additiveBlending`, 0.04, columnColor, heightScale)
    const ground = this.getGround3d(pin, NormalBlending, `ground_${pin.id}`, settings.ground, settings.column.scale)
    // const outline = this.getOutline3d(pin, NormalBlending, `outline_${pin.id}`, 0.02, columnColor, origionalMesh)
    group.add(ground)
    // group.add( outline );
    group.add(origionalMesh)
    // group.add(lightingMesh)
    return group
  }

  parseStringColorToInt = (hashStringColor: string) => {
    const colorR = hashStringColor.slice(1,3)
    const colorG = hashStringColor.slice(3,5)
    const colorB = hashStringColor.slice(5,7)
    const stringByteColor = `0x${colorR}${colorG}${colorB}`
    const intColor = parseInt(stringByteColor, 16)
    return intColor
  }

  getGround3d = (pin: Pin, blending: any, name:string, settings: GuiGroundSettings, asCircleScale: number) => {
    if (!pin.position3d) throw new Error("No Longitude or latitude when initing mesh");
    const circleRadius = Math.pow(asCircleScale, 2)
    const circleGeo = new CircleGeometry(circleRadius, 18)
    circleGeo.rotateX(-Math.PI * 0.5)
    circleGeo.rotateY(Math.PI / 18)
    const normalizedHeight = pin.id*0.0001 + 0.0001
    circleGeo.translate(pin.position3d.x,normalizedHeight,pin.position3d.z)
    const circleMat = new MeshPhongMaterial({
      transparent: true,
      opacity: settings.opacity,
      color: this.parseStringColorToInt(settings.color),
      blending: blending,
    })
    const circle = new Mesh( circleGeo, circleMat)
    circle.name = name
    return circle
  }


  getOutline3d = (pin: Pin, blending: any, name:string, opacity: number, color: string, outlinFromMesh: Mesh<CylinderGeometry, MeshPhongMaterial>) => {
    if (!pin.position3d) throw new Error("No Longitude or latitude when initing mesh");
    const edges = new EdgesGeometry( outlinFromMesh.geometry );
    const line = new LineSegments( edges, new LineBasicMaterial( { color: this.parseStringColorToInt(color), opacity: opacity, transparent: true, blending: blending} ) );
    line.name = name
    return line
  }

  getColumn3d = (pin: Pin, blending: any, name:string, settings: GuiColumnSettings):Mesh<CylinderGeometry, MeshPhongMaterial> => {
    if (!pin.position3d) throw new Error("No Longitude or latitude when initing mesh");
    let material
    material = new MeshPhongMaterial( {
      transparent: true,
      opacity: settings.opacity,
      color: this.parseStringColorToInt(settings.color),
      blending: blending,
      depthWrite: false
    })
    const bottomRadius = Math.pow(settings.scale, 2)
    const topRadius = Math.pow(settings.scale, 2)
    const height = pin.height * Math.pow(settings.heightScale, 2)
    const radialSegments = 18
    const heightSegments = 5
    const geometry = new CylinderGeometry( bottomRadius, topRadius, height, radialSegments, heightSegments, false, )
    const mesh = new Mesh(geometry, material)
    const normalizedHeight = pin.position3d.y + height / 2
    mesh.geometry.translate(pin.position3d.x,normalizedHeight-0.01,pin.position3d.z)
    mesh.name = name
    return mesh
  }
}
