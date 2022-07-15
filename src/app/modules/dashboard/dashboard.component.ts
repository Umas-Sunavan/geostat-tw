import { Component, ElementRef, Inject, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, lastValueFrom, map, of, pluck, take, tap } from 'rxjs';
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
import { PinsTableService } from '../map/map-viewer/map-canvas/pin-services/pins-table.service';
import { environment } from 'src/environments/environment';

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
    private router: Router,
    private pinTableService: PinsTableService
  ) { }

  userData?: Auth0User

  async ngOnInit(): Promise<void> {
    try {
      const accessToken = await lastValueFrom(this.auth.getAccessTokenSilently())
      this.cookieService.set("accessToken", accessToken)
    } catch (error) {
      this.logout()
      this.router.navigate(['login'])
      console.error(error);
    }
    this.auth.user$.pipe(
      take(1),
      concatMap((user) =>
        this.httpClient.get<Auth0User>(
          encodeURI(`https://dev-a63zgv8t.us.auth0.com/api/v2/users/${user?.sub}`)
        )
      )
    )
    .subscribe( userData => this.userData = userData);
  }

  logout = () => {
    console.log(this.document.location.origin);
    this.cookieService.delete("accessToken")
    this.auth.logout({ returnTo: `${environment.callbackUrl}/login` })
  }

  clickSpace = (event: MouseEvent, mapsCompoent: MapsComponent, categoriesCompoent: CategoriesComponent) => {
    mapsCompoent.clickSpace(event)
    categoriesCompoent.clickSpace(event)
    event.stopPropagation();
  }

}
