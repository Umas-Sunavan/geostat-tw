import { Component, OnInit } from '@angular/core';
import { Pin, PinOnDnc } from 'src/app/shared/models/Pin';
import { Color, Vector2, Vector3 } from 'three';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.sass']
})
export class MapViewerComponent implements OnInit {

  constructor() { }

  hoverPin?: { pin: Pin, legendPosition: Vector2}
  selectedPin: { pin: Pin, legendPosition: Vector2}[] = []
  pinsOnSelect: PinOnDnc[] = []
  averageMoving: Vector2[] = []

  changeHoverLegend = (options?: { pin: Pin, legendPosition: Vector2}) => {
    this.hoverPin = options
  }

  updateSelectLegend = (pinOnSelect: PinOnDnc[]) => {
    this.pinsOnSelect.forEach( (pin,i) => {
      // const delta = pin.deviceCoordinate.clone().sub(pinOnSelect[i].deviceCoordinate)
      // const x = Math.floor(delta.x)
      // const y = Math.floor(delta.y)
      // console.log(`x: ${x}, y: ${y}`);
      // if (this.averageMoving.length >= this.pinsOnSelect.length * 6) {
        // this.averageMoving.shift()
      // }
      // this.averageMoving.push(delta)
      // const smoothX = this.averageMoving.map( vec2 => vec2.x).reduce( (p,c) => p+c ) / (this.averageMoving.length)
      // const smoothY = this.averageMoving.map( vec2 => vec2.y).reduce( (p,c) => p+c ) / (this.averageMoving.length)
      // console.log(smoothX, smoothY);
      const nextPosition = pinOnSelect[i].deviceCoordinate.clone()
      const thisPosition = pin.deviceCoordinate
      const lerp = nextPosition.sub(thisPosition).multiplyScalar(0.1)
      pinOnSelect[i].deviceCoordinate = pin.deviceCoordinate.clone().add(lerp)
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
