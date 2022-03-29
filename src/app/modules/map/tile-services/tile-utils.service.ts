import { Injectable } from '@angular/core';
import { Tile } from 'src/app/shared/models/Tile';
import { TileId } from 'src/app/shared/models/TileId';

@Injectable({
  providedIn: 'root'
})
export class TileUtilsService {

  constructor() { }

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
