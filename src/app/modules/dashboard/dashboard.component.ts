import { Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom, map } from 'rxjs';
import { CategorySetting, CategorySettings, CategorySettingWithId } from 'src/app/shared/models/CategorySettings';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { CategoryService } from '../map/map-viewer/map-canvas/category/category.service';
import { MapHttpService } from '../../shared/services/map-http/map-http.service';
import { CategoriesComponent } from './categories/categories.component';
import { MapsComponent } from './maps/maps.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit {

  constructor(
  ) { }

  async ngOnInit(): Promise<void> {
  }

  clickSpace = (event: MouseEvent, mapsCompoent: MapsComponent, categoriesCompoent: CategoriesComponent) => {
    mapsCompoent.clickSpace(event)
    categoriesCompoent.clickSpace(event)
    event.stopPropagation();
  }

}
