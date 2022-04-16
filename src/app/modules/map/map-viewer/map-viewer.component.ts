import { Component, OnInit } from '@angular/core';
import { Color } from 'three';

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.sass']
})
export class MapViewerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  sliderChange = ($event: Event, target: string) => {

  }

  changeColumnHeight = ($event: Event) => {

  }

}
