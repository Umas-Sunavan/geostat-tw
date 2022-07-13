import { Component, ElementRef, Inject, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, lastValueFrom, map, pluck, take, tap } from 'rxjs';
import { CategorySetting, CategorySettings, CategorySettingWithId } from 'src/app/shared/models/CategorySettings';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { CategoryService } from '../map/map-viewer/map-canvas/category/category.service';
import { MapHttpService } from '../../shared/services/map-http/map-http.service';
import { CategoriesComponent } from './categories/categories.component';
import { MapsComponent } from './maps/maps.component';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';
import { Auth0User } from 'src/app/shared/models/Auth0User';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit {

  constructor(
    @Inject(DOCUMENT) 
    public document: Document, 
    public auth: AuthService,
    private cookieService: CookieService,
    private httpClient: HttpClient,
  ) { }

  userData?: Auth0User

  async ngOnInit(): Promise<void> {
    const accessToken = await lastValueFrom(this.auth.getAccessTokenSilently())
    this.cookieService.set("accessToken", accessToken)
    this.auth.user$.pipe(
      take(1),
      concatMap((user) =>
        // Use HttpClient to make the call
        this.httpClient.get<Auth0User>(
          encodeURI(`https://dev-a63zgv8t.us.auth0.com/api/v2/users/${user?.sub}`)
        )
      )
    )
    .subscribe( userData => this.userData = userData);

  }

  clickSpace = (event: MouseEvent, mapsCompoent: MapsComponent, categoriesCompoent: CategoriesComponent) => {
    mapsCompoent.clickSpace(event)
    categoriesCompoent.clickSpace(event)
    event.stopPropagation();
    console.log(this.cookieService.get("accessToken"));
  }

}
