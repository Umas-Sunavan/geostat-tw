import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Auth0Client } from '@auth0/auth0-spa-js';
import { CookieService } from 'ngx-cookie-service';
import { catchError, mergeMap, Observable, of } from 'rxjs';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapHttpService {

  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService,
  ) { }

  getAccessToken = () => this.cookieService.get("accessToken")

  createHeader = () => new HttpHeaders({ "authorization": `Bearer ${this.getAccessToken()}`, 'content-type': 'application/x-www-form-urlencoded'})

  getFrontEndUrl = () => environment.useProductionApi ? 'https://us-central1-twgeostat.cloudfunctions.net/getDB' : 'http://localhost:8081'

  getMaps = (): Observable<HttpMap[]> => {
    return this.httpClient.get<HttpMap[]>(`${this.getFrontEndUrl()}/maps`, { headers: this.createHeader()})
  }

  getMockMaps = ():Observable<HttpMap[]> => {
    return of(
      [
        { "mapId": 1, "mapName": "分店資料", "createdTime": "2022-05-22T03:34:43Z", "creator": "admin", "defaultCategoryId": "-N-SasgrgpgWs2szH-aH" , "pinSheetId": "1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM"},
        { "mapId": 2, "mapName": "簡報用地圖", "createdTime": "2022-05-24T05:35:35Z", "creator": "admin", "defaultCategoryId": "-N1hLpiGatywxzYbbuJy" , "pinSheetId": "1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM"},
        { "mapId": 3, "mapName": "開張分店地圖", "createdTime": "2022-05-24T13:05:06Z", "creator": "admin", "defaultCategoryId": "adwqfeswdq" , "pinSheetId": "1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM"},
        { "mapId": 4, "mapName": "開張分店地圖", "createdTime": "2022-05-24T13:09:58Z", "creator": "admin", "defaultCategoryId": "adwqfeswdq" , "pinSheetId": "1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM"},
        { "mapId": 5, "mapName": "實體行銷舉辦分店地圖", "createdTime": "2022-05-24T13:13:31Z", "creator": "admin", "defaultCategoryId": "-N-SasgrgpgWs2szH-aH" , "pinSheetId": "1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM"}]
    )
  }

  deleteMap = (id: number):Observable<{message:string}> => {
    return this.httpClient.delete<{message:string}>(`${this.getFrontEndUrl()}/maps/${id}`, { headers: this.createHeader()})
  }

  renameMap = (id: number, name: string):Observable<{message:string}> => {
    let body = new URLSearchParams();
    body.set('name', name);
    return this.httpClient.post<{message:string}>(`${this.getFrontEndUrl()}/maps/${id}/rename`, body.toString(), { headers: this.createHeader() })
  }

  addMap = (name: string, creator: string, defaultCategoryId: string, mapOptionId: string):Observable<{message:string, id: string, name: string}> => {
    let body = new URLSearchParams();
    body.set('name', name);
    body.set('creator', creator);
    body.set('defaultCategoryId', defaultCategoryId);
    body.set('mapSettingId', mapOptionId);
    body.set('pinSheetId', '');
    // const body = {
    //   name:name,
    //   creator: creator,
    //   defaultCategoryId: defaultCategoryId,
    //   mapSettingId: mapOptionId
    // }
    // let headers = new HttpHeaders().set('content-type', 'multipart/form-data')
    return this.httpClient.post<{message:string, id: string, name: string}>(`${this.getFrontEndUrl()}/maps/`, body.toString(), { headers: this.createHeader() })
  }

  getMap = (id: number) => {
    return this.httpClient.get<HttpMap>(`${this.getFrontEndUrl()}/maps/${id}`, { headers: this.createHeader()})
  }

  changeDefaultCategory = (mapId: string, categoryId: string) => {
    let body = new URLSearchParams();
    body.set("category", categoryId)
    return this.httpClient.post<{message:string}>(`${this.getFrontEndUrl()}/maps/${mapId}/category`, body.toString(), { headers: this.createHeader() })
  }
}
