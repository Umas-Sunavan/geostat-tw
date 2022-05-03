import { AfterContentInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MapCanvasComponent } from '../../map-canvas/map-canvas.component';

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['./map-settings.component.sass']
})
export class MapSettingsComponent implements OnInit,OnChanges {

  constructor() { }

  // @Input('canvas') set canvas() => {}
  @Input('canvas') canvas?: HTMLCanvasElement
  blurSource:string = ''

  ngOnChanges(changes: SimpleChanges): void {
    if(this.canvas) {
      console.log(this.canvas.toDataURL("image/png"));
      this.blurSource = `url(${this.canvas.toDataURL("image/png")}`
    }
  }


  ngOnInit(): void {



  }

}

