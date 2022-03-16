import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, map, firstValueFrom } from 'rxjs';
import { TileId } from 'src/app/shared/models/TileId';

@Injectable({
  providedIn: 'root'
})
export class TileService {

  constructor(
    private httpClient: HttpClient
  ) { }

  getTextureTile = async (tileId: TileId): Promise<ArrayBuffer> => {
    const options = {
      responseType: 'arraybuffer' as const,
    };
    return firstValueFrom(this.httpClient.get(`https://tile.openstreetmap.org/${tileId.z}/${tileId.x}/${tileId.y}.png`, options))
  }

  getHeightBuffer = async (tileId: TileId): Promise<ArrayBuffer> => {
    const options = {
      responseType: 'arraybuffer' as const,
    };
    return firstValueFrom(this.httpClient.get(`https://api.mapbox.com/v4/mapbox.terrain-rgb/${tileId.z}/${tileId.x}/${tileId.y}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`, options))
  }
}
