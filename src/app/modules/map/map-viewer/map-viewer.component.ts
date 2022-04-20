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

  meshTitle: string = ''
  meshTitleX: number = 0
  meshTitleY: number = 0

  changeHoverLegend = (options?: { pin: Pin, legendPosition: Vector2}) => {
    if (options) {
      this.meshTitle = options.pin.title
      this.meshTitleX = options.legendPosition.x
      this.meshTitleY = options.legendPosition.y
    } else {
      this.meshTitle = ''
    }
  }

  updateClickedLegend = (pinOnHold: PinOnDeviceCoordinate[]) => {
    console.log(pinOnHold.map( pin => pin.deviceCoordinate?.toArray().join()));

    
  }

  ngOnInit(): void {
  }

  sliderChange = ($event: Event, target: string) => {

  }

  changeColumnHeight = ($event: Event) => {

  }

}
