import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, map, firstValueFrom, BehaviorSubject, switchMap, of, delay, concatMap, take, Observable } from 'rxjs';
import { TileId } from 'src/app/shared/models/TileId';
import { Tile } from 'src/app/shared/models/Tile';
import { DoubleSide, Mesh, MeshStandardMaterial, PlaneGeometry, Texture, TextureLoader } from 'three';

@Injectable({
  providedIn: 'root'
})
export class TileService {

  constructor(
  ) { }

  initTileId: TileId = {
    x: 212,
    y: 108,
    z: 8
  }

  onUserUpdateCamera: BehaviorSubject<string> = new BehaviorSubject('')

  queueToUpdateResolution!: Observable<string>

  getTileIdsOfLevel8 = (initTileId: TileId): TileId[] => {
    const tiles = []
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 5; y++) {
        const eachTileId = {
          x: initTileId.x + x,
          y: initTileId.y + y,
          z: initTileId.z
        }
        tiles.push(eachTileId)
      }
    }
    return tiles
  }

  initTileMesh = (tiles: Tile[], initTileId: TileId) => {
    for (const tile of tiles) {
      const tileResolution = tile.id.z
      const rate = Math.pow(2, tileResolution - 8) // Magnificate Rate
      const tileWidth = 12 / rate
      const meshName = `planeZ${tile.id.z}X${tile.id.x}Y${tile.id.y}`
      const mesh = this.getPlane(tileWidth, meshName)
      const initTileX = initTileId.x * rate
      const initTileY = initTileId.y * rate
      const offset = 0.5
      mesh.position.setX(((tile.id.x - initTileX + offset)) * tileWidth)
      mesh.position.setZ(((tile.id.y - initTileY + offset)) * tileWidth)
      // mesh.position.setY(tile.id.z * 0.3)
      mesh.rotateX(-Math.PI * 0.5)
      tile.mesh = mesh
    }
  }

  initTileMeshById = (tileIds: TileId[], initTileId: TileId) => {
    const tiles:Tile[] = []
    for (const tileId of tileIds) {
      const tileResolution = tileId.z
      const rate = Math.pow(2, tileResolution - 8) // Magnificate Rate
      const tileWidth = 12 / rate
      const meshName = `planeZ${tileId.z}X${tileId.x}Y${tileId.y}`
      const mesh = this.getPlane(tileWidth, meshName)
      const initTileX = initTileId.x * rate
      const initTileY = initTileId.y * rate
      const offset = 0.5
      mesh.position.setX(((tileId.x - initTileX + offset)) * tileWidth)
      mesh.position.setZ(((tileId.y - initTileY + offset)) * tileWidth)
      // mesh.position.setY(tileId.z * 0.3)
      mesh.rotateX(-Math.PI * 0.5)
      const tile:Tile = { id: tileId, mesh: mesh}
      tiles.push(tile)
    }
    return tiles
  }

  getPlane = (size: number = 50, planeName: string = 'planeDefalut') => {
    const planGeo = new PlaneGeometry(size, size, 100, 100)
    const planMaterial = new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide })
    const plane = new Mesh(planGeo, planMaterial)
    plane.name = planeName
    return plane
  }

  initOnUserUpdateResolution = () => {
    this.onUserUpdateCamera.pipe(
      switchMap(value => of(value).pipe(delay(1000))) // abandon too-frequent emission
    ).pipe(
      concatMap(() => this.queueToUpdateResolution.pipe(take(1))) // add emission to queue
    ).subscribe()
  }
}
