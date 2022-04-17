import { Injectable } from '@angular/core';
import { Pin } from 'src/app/shared/models/Pin';
import { CylinderGeometry, Group, Intersection, Mesh, MeshPhongMaterial, Object3D } from 'three';

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

  mappingToGroups = (pins:Pin[]) => {
    return pins.filter( pin => pin.mesh).map( pin => pin.mesh!)
  }

  filterGroupFromObjs = (objects: Object3D[]) => {
    return objects.filter( obj => this.isObjectAGroup(obj)) as Group[]
  }

  filterDuplicateGroup = (groups: Group[]) => {
    const unique: Group[] = []
    groups.forEach(group => {
      if(!group) return
      const isDuplicate = unique.some( uniquePin => uniquePin.name === group?.name)
      if (!isDuplicate) unique.push(group as Group)
    });
    return unique
  }

  getPinIdsFromIntersections = (intersections: Intersection[]) => {
    const objs = intersections.map( intersection => intersection.object)
    const parents = objs.map( obj => obj.parent!).filter( parent => Boolean(parent))
    const groups = this.filterGroupFromObjs(parents)
    const unique = this.filterDuplicateGroup(groups)
    const ids = unique.map( group => this.getPinIdFromGroup(group))
    return ids
  }

  getPinIdFromGroup = (group:Group) => {
    const id = group.name.match(/(?=.+_?)\d+/);
    const isValidId = id && id[0]
    if(isValidId) {
      return id[0]
    } else {
      throw new Error("hovered pin has no valid id");
    }
  }

  // mesh

  getPinMeshInGroup = (group: Group, selector: string) => group.children.find( child => child.name.includes(selector)) as Mesh<CylinderGeometry, MeshPhongMaterial>



}
