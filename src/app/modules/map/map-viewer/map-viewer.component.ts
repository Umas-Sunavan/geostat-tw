import { Component, OnInit } from '@angular/core';
import { Pin, PinWithDnc } from 'src/app/shared/models/Pin';
import { Polygon } from 'src/app/shared/models/Polygon';
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
  pinsOnSelect: PinWithDnc[] = []
  averageMoving: Vector2[] = []
  pins: Pin[] = []
  pinCheckedFromList?: Pin[]

  changeHoverLegend = (options?: { pin: Pin, legendPosition: Vector2}) => {
    this.hoverPin = options
  }

  ngOnInit(): void {
  }

  pinCheckedFromSettings = (pins: Pin[]) => {
    const newList = [...pins]
    this.pinCheckedFromList = newList
  }

  polygonUpdate = (polygons: Polygon[]) => {
    console.log(polygons);
    
  }
}
