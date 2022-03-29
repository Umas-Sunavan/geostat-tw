import { Injectable } from '@angular/core';
import { Tile } from 'src/app/shared/models/Tile';
import { TileId } from 'src/app/shared/models/TileId';
import { Camera, Object3D, Scene, Vector3 } from 'three';
import { TileService } from './tile.service';

@Injectable({
  providedIn: 'root'
})
export class TileUtilsService {

  constructor(
    private tileService: TileService
  ) { }

  // comparison

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

  // accessing

  getTileById = (fromTiles: Tile[], byId: TileId) => fromTiles.find(tile => {
    const found = this.isTileIdEqual(tile.id, byId)
    return found
  })

  getIdFromChildTile = (id: TileId): TileId => {
    const z = id.z - 1
    const x = Math.floor(id.x / 2)
    const y = Math.floor(id.y / 2)
    return { z, x, y }
  }
  
  // remove tile

  removeTileFromModalById = (tileIdToRemove: TileId, array: Tile[]): Tile[] => array.filter(tile => !this.isTileIdEqual(tile.id, tileIdToRemove))
  removeTileFromScene = (tile3d: Object3D<THREE.Event>) => tile3d.removeFromParent()

  removeTile = (tile:Tile, tiles: Tile[]) => {
    if (tile.mesh) {
      this.removeTileFromScene(tile.mesh)
      tiles = this.removeTileFromModalById(tile.id, tiles)
      return tiles
    } else {
      throw new Error("No mesh to remove tile");
    }
  }

  removeTileById = (tileId: TileId, modal: Tile[], scene: Scene) => {
    const regexToken = `planeZ${tileId.z}X${tileId.x}Y${tileId.y}`
    const regex = new RegExp(regexToken);
    const tile3d = scene.children.find(mesh => regex.test(mesh.name))
    if (tile3d) {
      this.removeTileFromScene(tile3d)
      modal = this.removeTileFromModalById(tileId, modal)
      return modal
    } else {
      console.error(JSON.stringify(tileId), new Date().toISOString());
      throw new Error("no tile to remove");
    }
  }

  removeTileByIds = (ids: TileId[], tiles: Tile[], scene: Scene) => {
    ids.forEach(id => {
      tiles = this.removeTileById(id, tiles, scene)
    })
    return tiles
  }

  // caculation

  calculateChildTileIdsFromId = (fromTileId: TileId) => {
    const newTileIds: TileId[] = []
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        const newTileRes = fromTileId.z + 1
        const newTileX = fromTileId.x * 2 + x
        const newTileY = fromTileId.y * 2 + y
        const newTile: TileId = {
          z: newTileRes,
          x: newTileX,
          y: newTileY,
        }
        newTileIds.push(newTile)
      }
    }
    return newTileIds
  }

  calculateChildTileIdsFromIds = (fromTileIds: TileId[]) => {
    const newTileIds: TileId[] = []
    fromTileIds.forEach(fromTileId => {
      const forEachNewTileIds = this.calculateChildTileIdsFromId(fromTileId)
      newTileIds.push(...forEachNewTileIds)
    })
    return newTileIds
  }

  getTileCenter = (tile: Tile) => {
    const rate = Math.pow(2, tile.id.z - 8) // Magnificate Rate
    const tileWidth = 1 / rate * 12
    const tileCenterOffset = tileWidth / 2
    const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate)) + tileCenterOffset
    const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate) + tileCenterOffset
    return new Vector3(tileCenterX, 0, tileCenterY)
  }

  getTileCorner = (tile: Tile) => {
    const rate = Math.pow(2, tile.id.z - 8) // Magnificate Rate
    const tileWidth = 1 / rate * 12
    const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate))
    const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate)
    return new Vector3(tileCenterX, 0, tileCenterY)
  }

  // distance

  isAnyTileCloseToCamera = (tiles: Tile[], camera: Camera) => {
    const _getTileCameraDistances = (tiles: Tile[]) => {
      const distances: { tile: Tile, distance: number }[] = []
      const cameraPosition = camera.position.clone()
      const _getDistance = (tile: Tile) => {
        if (tile.mesh) {
          const distance = cameraPosition.distanceTo(tile.mesh.position)
          distances.push({ tile, distance })
        } else {
          console.error('no mesh to child');
        }
      }
      tiles.forEach(tile => _getDistance(tile))
      return distances
    }
    const lengthMapping = _getTileCameraDistances(tiles)
    const canTrunChild = lengthMapping.some(({ tile, distance }) => {
      return distance < this.getDistanceThresholdOfTileToCamera(tile)
    })
    return canTrunChild
  }

  getDistanceThresholdOfTileToCamera = (tile: Tile) => {
    switch (tile.id.z) {
      case 9:
        return 8
      case 8:
        return 20
      default:
        return 20 / ((tile.id.z - 8) * (tile.id.z - 8)) - 1 / (tile.id.z - 8) - 0.14
    }
  }

  tilesFarToCanvasCenter = (tiles: Tile[], canvasCenter: Vector3) => {
    return tiles.filter(tile => {
      const tileCenter = this.getTileCenter(tile)
      const tileCorner = this.getTileCorner(tile)
      const tileCenterToCanvasCenter = new Vector3().subVectors(tileCenter, canvasCenter).length()
      const tileCornerToCanvasCenter = new Vector3().subVectors(tileCenter, tileCorner).length()
      const tileCornerToOppositeCorner = tileCornerToCanvasCenter * 2
      const tileFarToCanvasCenter = tileCenterToCanvasCenter > tileCornerToOppositeCorner * 4
      return tileFarToCanvasCenter
    })
  }

  tilesCloseToCanvasCenter = (tiles: Tile[], canvasCenter: Vector3) => {
    return tiles.filter(tile => {
      const tileCenter = this.getTileCenter(tile)
      const tileCorner = this.getTileCorner(tile)
      const tileCenterToCanvasCenter = new Vector3().subVectors(tileCenter, canvasCenter).length()
      const tileCornerToCanvasCenter = new Vector3().subVectors(tileCenter, tileCorner).length()
      const tileCornerToOppositeCorner = tileCornerToCanvasCenter * 2
      const tileCloseToCanvasCenter = tileCenterToCanvasCenter < tileCornerToOppositeCorner
      return tileCloseToCanvasCenter
    })
  }


}
