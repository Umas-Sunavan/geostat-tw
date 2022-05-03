import { AfterContentInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { take } from 'rxjs';
import { MapCanvasComponent } from '../../map-canvas/map-canvas.component';
import { AnimateService } from '../../map-canvas/three-services/animate.service';

@Component({
  selector: 'app-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['./map-settings.component.sass']
})
export class MapSettingsComponent implements OnInit {

  constructor(
    private animateService: AnimateService,
  ) { }

  // @Input('canvas') set canvas() => {}
  blurSource:string = ''
  showSettings: boolean = false

  ngOnInit(): void {


  }

  toggleShow = () => {
    this.showSettings = !this.showSettings
    if(this.showSettings) {
      this.animateService.getCavasImage().pipe(take(1)).subscribe( value => {
        console.log(value);
        this.blurSource = `url(${value})`
      })
    }
  }

}

