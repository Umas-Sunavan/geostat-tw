import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { Pin, PinWithDnc } from 'src/app/shared/models/Pin';
import { Polygon } from 'src/app/shared/models/Polygon';
import { Color, Vector2, Vector3 } from 'three';
import { MapHttpService } from '../../../shared/services/map-http/map-http.service';
import { PinsTableService } from './map-canvas/pin-services/pins-table.service';
import { AnimateService } from './map-canvas/three-services/animate.service';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.sass']
})
export class MapViewerComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private mapHttpService: MapHttpService,
    private pinsTableService: PinsTableService,
    private animateService: AnimateService
  ) { }

  hoverPin?: { pin: Pin, legendPosition: Vector2 }
  selectedPin: { pin: Pin, legendPosition: Vector2 }[] = []
  pinsSelectedWithDnc: PinWithDnc[] = []
  averageMoving: Vector2[] = []
  pins: Pin[] = []
  pinSelected?: Pin[]
  isLoadingTile = false
  mapTitle: string = ""
  mapModelFromDb!: HttpMap
  hoverLogo = false
  showResetPosition = false
  resetCooldown = false
  isAddPinSheetFlowShow = false
  isCategoryPickerShow = false
  pinSheetId?:string
  initAddingCategory = false

  completeAddPinSheetFlow= (sheetId: string) => {
    this.isAddPinSheetFlowShow = !this.isAddPinSheetFlowShow
    this.updatePinSheet(sheetId)
    this.isCategoryPickerShow = true
    this.initAddingCategory = false
    console.log(this.initAddingCategory);
    
  }

  updatePinSheet = (sheetId:string) => {
    this.pinsTableService.updatePinSheetId(this.mapModelFromDb.mapId, sheetId).subscribe( result => {
      console.log(result);
    })
  }

  changeHoverLegend = (options?: { pin: Pin, legendPosition: Vector2 }) => {
    this.hoverPin = options
  }

  getDefaultCategoryFromDb = async () => {
    const mapId = this.activatedRoute.snapshot.paramMap.get("id")
    if(mapId !== null && +mapId !== NaN) {
      const map: HttpMap = await lastValueFrom(this.mapHttpService.getMap(+mapId))
      return map
    } else {
      throw new Error("map id is not a number");
    }
  }
  

  async ngOnInit(): Promise<void> {
    this.animateService.removeAllIntersetObject()
    this.mapModelFromDb = await this.getDefaultCategoryFromDb()
    this.mapTitle = this.mapModelFromDb.mapName
    const id = this.mapModelFromDb.pinSheetId
    if (id !== "null" && id !== "") {
      this.isCategoryPickerShow = true
      this.pinSheetId = id
      console.log(this.pinSheetId);
      const pinSheet = await lastValueFrom(this.pinsTableService.getAddressFromSourceSheet(id))
      if(!pinSheet) throw new Error("found pin sheet id but no sheet content loaded");
    } else {
      this.beginAddPinSheetFlow()
    }
  }

  onPinSelected = (pins: Pin[]) => {
    const newList = [...pins]
    this.pinSelected = newList
  }

  onSelectedPinsWithDnc = (pinsWithDnc: any) => {
    this.pinsSelectedWithDnc.forEach( (pin,i) => {
      const isExist = Boolean(pinsWithDnc[i])
      if (isExist) {
        const nextPosition = pinsWithDnc[i].deviceCoordinate.clone()
        const thisPosition = pin.deviceCoordinate
        const lerp = nextPosition.sub(thisPosition).multiplyScalar(0.3)
        pinsWithDnc[i].deviceCoordinate = pin.deviceCoordinate.clone().add(lerp)
      }
    })
    this.pinsSelectedWithDnc = pinsWithDnc
  }

  polygonUpdate = (polygons: Polygon[]) => {
    console.log(polygons);
  }

  onLoadingTile = (isLoading: boolean) => {
    this.isLoadingTile = isLoading
  }

  onCameraPositionCanReset = (canShow: boolean) => {
    if (canShow && !this.resetCooldown) {
      this.showResetPosition = true
    } else {
      this.showResetPosition = false
      this.resetCooldown = true
      setTimeout(() => {
        this.resetCooldown = false
      }, 1000);
    }
  }

  beginAddPinSheetFlow = () => this.isAddPinSheetFlowShow = true
}
