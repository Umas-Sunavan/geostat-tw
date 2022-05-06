import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { take } from 'rxjs';
import { Gui3dSettings } from 'src/app/shared/models/GuiColumnSettings';
import { GuiPolygonSettings } from 'src/app/shared/models/GuiPolygonSettings';
import { Pin } from 'src/app/shared/models/Pin';
import { AnimateService } from '../map-canvas/three-services/animate.service';

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
  @Input() columnSettings!: Gui3dSettings
  @Input() polygonSettings!: GuiPolygonSettings
  @Input() pins: Pin[] = []
  @Input() hoveringPins: Pin[] = []
  @Input() selectedPins: Pin[] = []
  @Output() onPinChecked: EventEmitter<Pin> = new EventEmitter()
  
  testValue = 0.5
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

  pinChecked = (pin: Pin) => {
    console.log(pin);
    this.onPinChecked.emit(pin)
  }

}
