import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CategoryTableRow } from 'src/app/shared/models/CategoryTableRow';
import { Vector2, Vector3 } from 'three';
import { GoogleSheetPinMappingLonLat } from 'src/app/shared/models/GoogleSheetPinMappingLonLat';
import { Pin } from 'src/app/shared/models/Pin';
import { TileLonglatCalculationService } from '../tile-services/tile-longlat-calculation.service';
import { PinsTableService } from './pins-table.service';
import { CategorySetting } from 'src/app/shared/models/CategorySettings';
import { CategoryService } from '../category/category.service';
import { PinCategoryMappingService } from '../../../pin-category-mapping.service';

@Injectable({
  providedIn: 'root'
})
export class PinModelService {

  constructor(
    private tileLonLatCalculation: TileLonglatCalculationService,
    private pinsTableService: PinsTableService,
    private categoryService: CategoryService,
    private pinCategoryMapping: PinCategoryMappingService,
  ) { }

  initPinsModel = async () => {
    const googleSheetPinsMappingLonLat = await lastValueFrom(this.pinsTableService.getPinLonLat())
    console.log(googleSheetPinsMappingLonLat);
    
    const pins = this.createPinsModel(googleSheetPinsMappingLonLat)
    return pins
  }

  createPinsModel = (fromSheet: GoogleSheetPinMappingLonLat[]):Pin[] => {
    const formatPosition3d = (lonLat: Vector2) => {
      return new Vector3(lonLat.x, 0 , lonLat.y)
    }
    const formatTilePosition = (lonLat: Vector2) => {
      const lon = lonLat.x
      const lat = lonLat.y
      const tileX = this.tileLonLatCalculation.lat2tile(lat, 8)
      const tileY = this.tileLonLatCalculation.lon2tile(lon, 8)
      return new Vector2(tileX, tileY)
    }

    return fromSheet.map( (googleSheetPin: GoogleSheetPinMappingLonLat) => {
      return {
        id: googleSheetPin.pinData.id,
        height: 0.3,
        color: 0xff195d,
        title: googleSheetPin.pinData.title,
        address: googleSheetPin.pinData.address,
        position3d: formatPosition3d(googleSheetPin.lonLat),
        positionTile: formatTilePosition(googleSheetPin.lonLat),
        positionLongLat: googleSheetPin.lonLat,
        radius: 0.1
      }
    })
  }

  applyPinHeightFromSetting = async (setting: CategorySetting, pins: Pin[]) => {
    const categoryTable = await this.categoryService.getTableFromSettings(setting)
    const { mappedPins, mappedRows } = this.pinCategoryMapping.mappingPinAndTable(categoryTable, pins)
    pins = this.updatePinHeightFromRows(mappedPins, mappedRows)
    return pins
  }

  updatePinHeightFromRows = (pins: Pin[], rows: CategoryTableRow[]) => {
    pins.forEach( pin => {
      const mappedRow = rows.find( row => row.title === pin.title)
      if(!mappedRow) throw new Error(`row is not found in pin ${pin.title}`);
      const value = Number(mappedRow.value)
      if(!value) throw new Error(`value in row ${mappedRow.title} in not a number`);
      pin.height = value
    })
    return pins
  }
}
