import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, map, firstValueFrom } from 'rxjs';
import { TileId } from 'src/app/shared/models/TileId';
import { Tile } from 'src/app/shared/models/Tile';
import { DoubleSide, Mesh, MeshStandardMaterial, PlaneGeometry, Texture, TextureLoader } from 'three';

@Injectable({
  providedIn: 'root'
})
export class TileService {

  constructor(
    private httpClient: HttpClient
  ) { }

  initTileId: TileId = {
    x: 212,
    y: 108,
    z: 8
  }

  textureMapppingCacheAndId: { texture: ArrayBuffer, id: TileId }[] = []

  getTextureFromCache = async (tileId: TileId) => {
    const mappingInCache = this.textureMapppingCacheAndId.find(mapping => this.isTileIdEqual(tileId, mapping.id))

    if (mappingInCache) {
      console.log(mappingInCache);
      return mappingInCache.texture
    } else {
      console.log('get from internet');

      const newTexutre = await this.getTextureBuffer(tileId)
      const newMapping = { id: tileId, texture: newTexutre }
      this.textureMapppingCacheAndId.push(newMapping)
      return newTexutre
    }
  }

  getTextureBuffer = async (tileId: TileId): Promise<ArrayBuffer> => {
    const options = {
      responseType: 'arraybuffer' as const,
    };
    return firstValueFrom(this.httpClient.get(`https://tile.openstreetmap.org/${tileId.z}/${tileId.x}/${tileId.y}.png`, options))
  }

  getHeightTileSrc = (z: number, x: number, y: number) => {
    console.log({ z, x, y });
    return `http://localhost:3000/${z}/${x}/${y}.pngraw`
    // return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`
  }

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

  getPlane = (size: number = 50, planeName: string = 'planeDefalut') => {
    const planGeo = new PlaneGeometry(size, size, 100, 100)
    const planMaterial = new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide })
    const plane = new Mesh(planGeo, planMaterial)
    plane.name = planeName
    return plane
  }

  isTileEqual = (atile: Tile, bTile: Tile) => {
    const sameX = atile.id.x === bTile.id.x
    const sameY = atile.id.y === bTile.id.y
    const sameZ = atile.id.z === bTile.id.z
    return sameX && sameY && sameZ
  }

  isTileIdEqual = (aId: TileId, bId: TileId) => {
    const sameX = aId.x === bId.x
    const sameY = aId.y === bId.y
    const sameZ = aId.z === bId.z
    return sameX && sameY && sameZ
  }
}
