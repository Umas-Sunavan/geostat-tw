import { AfterContentInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { take } from 'rxjs';
import { Gui3dSettings } from 'src/app/shared/models/GuiColumnSettings';
import { GuiPolygonSettings } from 'src/app/shared/models/GuiPolygonSettings';
import { MapCanvasComponent } from '../../map-canvas/map-canvas.component';
import { AnimateService } from '../../map-canvas/three-services/animate.service';

@Component({
  selector: 'app-map-3d-settings',
  templateUrl: './map-3d-settings.component.html',
  styleUrls: ['./map-3d-settings.component.sass']
})
export class Map3dSettingsComponent implements OnInit {

  constructor() {
    
  }
  @Input() columnSettings!: Gui3dSettings
  @Input() polygonSettings!: GuiPolygonSettings
  @Input() blurSource: string = ''
  @Output()columnSettingChange: EventEmitter<Event> = new EventEmitter()
  @Output()polygonSettingChange: EventEmitter<Event> = new EventEmitter()

  ngOnInit(): void {
    
  }

  changeColumn = (event: Event) => {
    this.columnSettingChange.emit(event)
  }

  changePolygon = (event: Event) => {
    this.polygonSettingChange.emit(event)
  }

}

