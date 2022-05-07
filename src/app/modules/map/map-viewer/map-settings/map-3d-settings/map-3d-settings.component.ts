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
export class Map3dSettingsComponent implements OnInit, AfterContentInit {

  constructor() {
    
  }
  @Input() columnSettings!: Gui3dSettings
  @Input() polygonSettings!: GuiPolygonSettings
  @Input() blurSource: string = ''
  @Output()columnSettingChange: EventEmitter<Event> = new EventEmitter()
  @Output()polygonSettingChange: EventEmitter<Event> = new EventEmitter()
  @ViewChild('resizeContainer') resizeContainer!: ElementRef<HTMLDivElement>
  isScrollBarShow: boolean = false

  ngOnInit(): void {
  }

  ngAfterContentInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
    this.onResize()
    }, 0);
  } 

  resize = () => {
    
  }

  onResize = (event?: Event) => {
    const contentSize = this.resizeContainer.nativeElement.scrollHeight
    const containerSize = this.resizeContainer.nativeElement.clientHeight
    this.isScrollBarShow = contentSize > containerSize
  }


  changeColumn = (event: Event) => {
    this.columnSettingChange.emit(event)
  }

  changePolygon = (event: Event) => {
    this.polygonSettingChange.emit(event)
  }

}

