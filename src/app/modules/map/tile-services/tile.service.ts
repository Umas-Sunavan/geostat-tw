import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, map, firstValueFrom } from 'rxjs';
import { TileId } from 'src/app/shared/models/TileId';
import { Tile } from 'src/app/shared/models/TileId copy';
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

  getTextureBuffer = async (tileId: TileId): Promise<ArrayBuffer> => {
    const options = {
      responseType: 'arraybuffer' as const,
    };
    return firstValueFrom(this.httpClient.get(`https://tile.openstreetmap.org/${tileId.z}/${tileId.x}/${tileId.y}.png`, options))
  }

  getHeightTileSrc = (z: number, x: number, y: number) => `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`

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
      const mesh = this.getPlane(10)
      mesh.position.setX((tile.id.x - initTileId.x) * 10)
      mesh.position.setZ((tile.id.y - initTileId.y) * 10)
      mesh.rotateX(-Math.PI * 0.5)
      tile.mesh = mesh
    }
  } 

  getPlane = (size: number = 50) => {
    const planGeo = new PlaneGeometry(size, size, 100, 100)
    const planMaterial = new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide })
    const plane = new Mesh(planGeo, planMaterial)
    return plane
  }
}
