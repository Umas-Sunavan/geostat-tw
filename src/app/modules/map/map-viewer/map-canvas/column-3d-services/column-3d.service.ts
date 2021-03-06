import { Injectable } from '@angular/core';
import { Gui3dSettings, GuiColumnSettings, GuiDefaultColumnSettings, GuiGroundSettings } from 'src/app/shared/models/GuiColumnSettings';
import { Pin } from 'src/app/shared/models/Pin';
import { AdditiveBlending, BufferGeometry, CircleGeometry, Color, CylinderGeometry, DoubleSide, EdgesGeometry, Group, Line, LineBasicMaterial, LineSegments, Mesh, MeshPhongMaterial, NormalBlending, Scene, SubtractiveBlending, Vector3 } from 'three';
import { PinModelService } from '../pin-services/pin-model.service';
import { PinUtilsService } from '../pin-services/pin-utils.service';

@Injectable({
  providedIn: 'root'
})
export class Column3dService {

  constructor(
    private pinUtilsService: PinUtilsService,
  ) { }
  

  createColumn3dLayers = (pin: Pin, settings: Gui3dSettings) => {
    const group = new Group();
    const origionalMesh = this.getColumn3d(pin, NormalBlending, `pin_column_${pin.id}_normalBlending`, settings.columns.defaultColumn)
    // const lightingMesh = this.getColumn3d(pin, AdditiveBlending, `column_${pin.id}_additiveBlending`, 0.04, columnColor, heightScale)
    const ground = this.getGround3d(pin, NormalBlending, `pin_ground_${pin.id}`, settings.ground, settings.columns.defaultColumn.scale)
    // const outline = this.getOutline3d(pin, NormalBlending, `outline_${pin.id}`, 0.02, columnColor, origionalMesh)
    const point = this.getLine(pin, NormalBlending, `pin_line_${pin.id}`, settings.columns.defaultColumn)
    if (point) {
      group.add(point)
    }
    group.add(ground)
    // group.add( outline );
    group.add(origionalMesh)
    // group.add(lightingMesh)
    group.name = `pin_group_` + pin.id
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
  
  getLine = (pin: Pin, blending: any, name:string, settings: GuiColumnSettings) => {
    const points = [];
    if (!pin.position3d) return
    points.push( pin.position3d );
    points.push( pin.position3d.clone().setY(0.1));
    const geometry = new BufferGeometry().setFromPoints( points );
    const material = new LineBasicMaterial( { color: settings.color } );
    const line = new Line( geometry, material );
    line.name = name
    return line
  }

  getGround3d = (pin: Pin, blending: any, name:string, settings: GuiGroundSettings, asCircleScale: number) => {
    if (!pin.position3d) throw new Error("No Longitude or latitude when initing mesh");
    const circleRadius = asCircleScale / 12
    const circleGeo = new CircleGeometry(circleRadius, 36)
    circleGeo.rotateX(-Math.PI * 0.5)
    circleGeo.rotateY(Math.PI / 18)
    const normalizedHeight = (pin.id % 20) * 0.01 - 0.099
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

  getColumn3d = (pin: Pin, blending: any, name:string, settings: GuiDefaultColumnSettings):Mesh<CylinderGeometry, MeshPhongMaterial> => {
    if (!pin.position3d) throw new Error("No Longitude or latitude when initing mesh");
    let material
    material = new MeshPhongMaterial( {
      transparent: true,
      opacity: settings.opacity,
      color: this.parseStringColorToInt(settings.color),
      blending: blending,
      depthWrite: false
    })
    // one settings.scale unit is 1/12 km
    const bottomRadius = settings.scale / 12
    const topRadius = settings.scale / 12
    const height = pin.height * Math.pow(settings.heightScale, 2)
    const radialSegments = 36
    const heightSegments = 5
    const geometry = new CylinderGeometry( bottomRadius, topRadius, height, radialSegments, heightSegments, false, )
    const mesh = new Mesh(geometry, material)
    const normalizedHeight = pin.position3d.y + height / 2
    mesh.geometry.translate(pin.position3d.x,normalizedHeight-0.01,pin.position3d.z)
    mesh.name = name
    // mesh.castShadow = true
    return mesh
  }

  // Utils

  setDepthWrite = (groups: Group[], boolean: boolean, meshSelectors: string[]) => {
    groups.forEach( group => {
      meshSelectors.forEach( selector => {
        const mesh = this.pinUtilsService.getPinMeshInGroup(group, selector)
        mesh.material.depthWrite = boolean
      })
    })
  }

  updatePinsStyle = (pinsToHoverStyle:Pin[], resetSettings: Gui3dSettings, pinsToDefualtStyle: Pin[] = [], pinstoSelectedStyle: Pin[]) => {
    console.log(`to selected style: ${pinstoSelectedStyle}`);
    
    const setDefaultPinStyle = (pins: Pin[]) => {
      pins.forEach( pin => {
        const {column, ground} = this.pinUtilsService.getMeshesById(pins, pin.id)
        column.material.opacity = resetSettings.columns.defaultColumn.opacity
        column.material.color = new Color(this.parseStringColorToInt(resetSettings.columns.defaultColumn.color))
        column.material.depthWrite  = false
      })
    }
    const setHoverPinStyle = (pins: Pin[]) => {
      pins.forEach( pin => {
        const {column, ground} = this.pinUtilsService.getMeshesById(pins, pin.id)
        column.material.depthWrite  = true
        column.material.opacity = resetSettings.columns.hoveredColumn.opacity
        column.material.color = new Color(this.parseStringColorToInt(resetSettings.columns.hoveredColumn.color))
      })
    }

    const setSelectPinStyle = (pins: Pin[]) => {
      pins.forEach( pin => {
        const {column, ground} = this.pinUtilsService.getMeshesById(pins, pin.id)
        column.material.depthWrite  = true
        column.material.opacity = resetSettings.columns.selectedColumn.opacity
        column.material.color = new Color(this.parseStringColorToInt(resetSettings.columns.selectedColumn.color))
      })
    }
    
    setDefaultPinStyle(pinsToDefualtStyle)
    setHoverPinStyle(pinsToHoverStyle)
    setSelectPinStyle(pinstoSelectedStyle)
    return pinsToHoverStyle
  }
}
