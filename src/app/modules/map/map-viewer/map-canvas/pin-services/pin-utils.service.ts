import { Injectable } from '@angular/core';
import { Pin } from 'src/app/shared/models/Pin';
import { CylinderGeometry, Group, Mesh, MeshPhongMaterial, Object3D } from 'three';

@Injectable({
  providedIn: 'root'
})
export class PinUtilsService {

  constructor() { }


  // utils: 

  // comparation

  isSamePins = (pinsA: Pin[], pinsB: Pin[]) => {
    const aIds = pinsA.map( pin => +pin.id).sort((a,b) => a-b);
    const bIds = pinsB.map( pin => +pin.id).sort((a,b) => a-b);
    const isEqual = JSON.stringify(aIds) === JSON.stringify(bIds)
    return isEqual
  }

  isObjectAGroup = ( object: Object3D) => {
    const isGroup = object.children.find( mesh => mesh.parent?.name.includes('group')) as Group
    return isGroup
  }

  // find

  findPinById = (pins: Pin[], ids: string[]) =>  {
    return ids.map( id => {
      const found  =pins.find( pin => pin.id+'' === id)
      if (!found) throw new Error("the raycasted group object is not found in this.pins");
      return found
    })
  }

  getMeshesById = (pins: Pin[], pinId: number) => {
    const pin = pins.find( pin => pin.id === pinId)
    const group = pin?.mesh
    if (group) {
      const column = this.getPinMeshInGroup(group, 'column')
      const ground = this.getPinMeshInGroup(group, 'ground')
      return {column, ground}
    } else {
      throw new Error("No group found ");
    }
  }

  // tranform

  mappingToMeshes = (pins:Pin[]) => {
    return pins.filter( pin => pin.mesh).map( pin => pin.mesh!)
  }

  filterGroup = (objects: Object3D[]) => {
    return objects.filter( obj => this.isObjectAGroup(obj)) as Group[]
  }

  // mesh

  getPinMeshInGroup = (group: Group, selector: string) => group.children.find( child => child.name.includes(selector)) as Mesh<CylinderGeometry, MeshPhongMaterial>




}
