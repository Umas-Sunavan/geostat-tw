import { Injectable } from '@angular/core';
import { catchError, concat, concatMap, delay, forkJoin, from, lastValueFrom, map, mergeMap, Observable, of, tap } from 'rxjs';
import { CategoryTableRow } from 'src/app/shared/models/CategoryTableRow';
import { CircleGeometry, CylinderGeometry, Group, Mesh, MeshPhongMaterial, Object3D, Scene, Vector2, Vector3 } from 'three';
import { GoogleSheetPinMappingLonLat } from 'src/app/shared/models/GoogleSheetPinMappingLonLat';
import { Pin } from 'src/app/shared/models/Pin';
import { TileLonglatCalculationService } from '../tile-services/tile-longlat-calculation.service';
import { PinsTableService } from './pins-table.service';
import { CategorySetting } from 'src/app/shared/models/CategorySettings';
import { CategoryService } from '../category/category.service';
import { PinCategoryMappingService } from '../category/pin-category-mapping.service';
import { Gui3dSettings } from 'src/app/shared/models/GuiColumnSettings';
import { TileUtilsService } from '../tile-services/tile-utils.service';
import { Column3dService } from '../column-3d-services/column-3d.service';
import { AnimateService } from '../three-services/animate.service';
import { GoogleSheetPin } from 'src/app/shared/models/GoogleSheetPin';

@Injectable({
  providedIn: 'root'
})
export class PinModelService {

  constructor(
    private tileLonLatCalculation: TileLonglatCalculationService,
    private pinsTableService: PinsTableService,
    private categoryService: CategoryService,
    private pinCategoryMapping: PinCategoryMappingService,
    private tileUtilsService: TileUtilsService,
    private column3dService: Column3dService,
    private animateService: AnimateService
  ) { }

  initPinsModel = async (pinTableSource: string) => {
    // retrieve all known address from DB (cache). As for the unknown address, theny needs to get geoencoding then put them to DB.
    const addressFromSheet:GoogleSheetPin[] = await lastValueFrom(this.pinsTableService.getAddressFromSourceSheet(pinTableSource))
    const lonlatCacheFromDb: GoogleSheetPinMappingLonLat[] = await lastValueFrom(this.pinsTableService.getPinsLonLatCache())
    const {availableCache, unCachedAddress} = this.filterAvailableLonlatCahce(addressFromSheet, lonlatCacheFromDb)
    const pinsJustCached = await this.groupingPinsToCache(unCachedAddress)
    const googleSheetPinsMappingLonLat = [...availableCache, ...pinsJustCached]      
    const pins = this.createPinsModel(googleSheetPinsMappingLonLat)
    return pins
  }

  groupingPinsToCache = async (addresses: GoogleSheetPin[] ) => {
    const groupingAddresses = (addresses: GoogleSheetPin[]):GoogleSheetPin[][] => {
      const emptyGroups = new Array(Math.ceil(addresses.length/10)).fill('').map((v,i) => i)
      const groups = emptyGroups.map( groupId => {
        const group = addresses.filter( (address, addressId) => {
          const sliceStartAt = groupId * 10
          const sliceEndAt = (groupId * 10) + 10
          return sliceStartAt <= addressId && sliceEndAt > addressId
        })
        return group
      })
      return groups
    }
    const groups = groupingAddresses(addresses)
    console.log(groups);
    
    const pinsCached = []
    for (const addresses of groups) {
      console.log(addresses);
      const pinsNeedsCache = await lastValueFrom(this.pinsTableService.getPinLonLatFromGeoencoding(addresses))        
      try {
        await lastValueFrom(this.addPinToCache(pinsNeedsCache))
      } catch (error) {
        console.error(error);         
      }
      pinsCached.push(...pinsNeedsCache)
    }
    return pinsCached
  }

  addPinToCache = (pins: GoogleSheetPinMappingLonLat[]) => {
    const requests = pins.map( pin => this.pinsTableService.addAddressCache(pin))
    if (requests.length > 0) {
      return concat(...requests).pipe( delay(250), tap( val => console.log((val.message))) , map( val => [val]))
    } else {
      return of([] as {message: string;}[])
    }
  }

  filterAvailableLonlatCahce = (source: GoogleSheetPin[], cache: GoogleSheetPinMappingLonLat[]) => {
    const availableCahce: GoogleSheetPinMappingLonLat[] = []
    const unCachedAddress: GoogleSheetPin[] = []
    source.filter( sourcePin => {
      const cachedLonlat = cache.find( cachedLonLat => cachedLonLat.pinData.address === sourcePin.address)
      if (cachedLonlat) {
        availableCahce.push(cachedLonlat)
      } else {
        unCachedAddress.push(sourcePin)
      } 
    })
    return { availableCache: availableCahce, unCachedAddress}
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
    if (!setting.valid) return    
    const categoryTable = await this.categoryService.getTableFromSettings(setting)
    const { mappedPins, mappedRows } = this.pinCategoryMapping.mappingPinAndTable(categoryTable, pins)    
    pins = this.updatePinHeightFromRows(mappedPins, mappedRows)    
    return {setting, pins}
  }

  updatePinHeightFromRows = (pins: Pin[], rows: CategoryTableRow[]) => {
    pins.forEach( pin => {      
      const mappedRow = rows.find( row => row.title === pin.title)
      if(!mappedRow) throw new Error(`row is not found in pin ${pin.title}`);
      const value = Number(mappedRow.value)
      if(!value && value !== 0) throw new Error(`value in row ${mappedRow.title} in not a number`);
      pin.height = value
    })
    return pins
  }

  updatePin3ds = (pins: Pin[], scene:Scene, settings: Gui3dSettings) => {
    this.removePins(pins)
    this.initPins(pins, scene, settings)
  }

  initPins = (pins: Pin[], scene: Scene, settings: Gui3dSettings) => {
    pins.forEach( pin => {      
      if (!pin.positionLongLat) throw new Error("No Longitude or latitude");
      pin.position3d = this.longLatToPosition3d(pin.positionLongLat)      
      const columnGroup = this.column3dService.createColumn3dLayers(pin, settings)
      this.animateService.passIntersetObject([columnGroup])
      
      pin.mesh = columnGroup      
      scene.add(columnGroup)
    })
  }
  
  removePins = (pins: Pin[]) => {
    pins.forEach( pin => {
      if (!pin.mesh) return
      pin.mesh.removeFromParent()
      this.animateService.removeIntersetObject(`pin`)
    })
  }

  longLatToPosition3d = (lonLat: Vector2) => {
    const long = lonLat.x
    const lat = lonLat.y
    const tileX = this.tileLonLatCalculation.lon2tile(long,8)
    const tileY = this.tileLonLatCalculation.lat2tile(lat,8)
    const scenePositionX = (tileX - this.tileUtilsService.initTileId.x) * 12
    const scenePositionY = (tileY - this.tileUtilsService.initTileId.y) * 12
    const position = new Vector3(scenePositionX, 0, scenePositionY)
    return position
  }

  // pin selection

  updateSelectedPins = (pinClicked: Pin, alreadySelectedPins: Pin[]) => {    
    const deselect =  alreadySelectedPins.some( pinOnHold => pinOnHold.id === pinClicked.id)    
    let updatedPins: Pin[] = []
    if (deselect) {
      // Deselect
      updatedPins =  alreadySelectedPins.filter( pin => pin.id !== pinClicked.id)
    } else {
      // Select
      updatedPins = [...alreadySelectedPins, pinClicked]
    }    
    return updatedPins
  }

}
