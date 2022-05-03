import { Component, OnInit } from '@angular/core';
import { Pin, PinWithDnc } from 'src/app/shared/models/Pin';
import { Color, Vector2, Vector3 } from 'three';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.sass']
})
export class MapViewerComponent implements OnInit {

  constructor() { }

  canvas?: HTMLCanvasElement
  hoverPin?: { pin: Pin, legendPosition: Vector2}
  selectedPin: { pin: Pin, legendPosition: Vector2}[] = []
  pinsOnSelect: PinWithDnc[] = []
  averageMoving: Vector2[] = []

  storeCanvasDom = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas
  }

  changeHoverLegend = (options?: { pin: Pin, legendPosition: Vector2}) => {
    this.hoverPin = options
  }

  updateSelectLegend = (pinOnSelect: PinWithDnc[]) => {
    this.pinsOnSelect.forEach( (pin,i) => {
      const isExist = Boolean(pinOnSelect[i])
      if (isExist) {
        const nextPosition = pinOnSelect[i].deviceCoordinate.clone()
        const thisPosition = pin.deviceCoordinate
        const lerp = nextPosition.sub(thisPosition).multiplyScalar(0.2)
        pinOnSelect[i].deviceCoordinate = pin.deviceCoordinate.clone().add(lerp)
      }
    })
    this.pinsOnSelect = pinOnSelect
    console.log();
    
  }

  ngOnInit(): void {
  }

  sliderChange = ($event: Event, target: string) => {

  }

  changeColumnHeight = ($event: Event) => {

  }

}
