import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { concatMap, forkJoin, from, map, mergeMap, Observable, tap } from 'rxjs';
import { PointDataMappingLonLat } from 'src/app/shared/models/PointDataMappingLonLat';
import { GeoencodingRaw } from 'src/app/shared/models/Geoencoding';
import { GoogleSheetRawData, PointDataRowInSheet } from 'src/app/shared/models/GoogleSheetRawData';
import { PointFromSheet } from 'src/app/shared/models/PointFromSheet';
import { PointDataMappingGeoencodingRaw } from 'src/app/shared/models/PointFromSheetMappingGeoendodingRaw';
import { Vector2 } from 'three';

@Injectable({
  providedIn: 'root'
})
export class PointDataService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  getGoogleSheetInfo = (googleSheetId: string = '1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM'): Observable<PointDataMappingLonLat[]> => {
    const options = {responseType: 'text' as 'json',};
    return this.httpClient.get<GoogleSheetRawData>(`https://docs.google.com/spreadsheets/d/${googleSheetId}/gviz/tq?`, options).pipe(
      this.convertGoogleSheetToAddress,
      this.convertAddressToRawGeoencoding,
      this.convertGoogleGeoencodingToLonLat
    )
  }
  
  convertGoogleSheetToAddress = map((rawdata): PointFromSheet[] => {
    rawdata = this.removeExtraText(rawdata as string)    
    const raw = <GoogleSheetRawData>JSON.parse(rawdata as string)    
    const sheetData: PointDataRowInSheet[] = raw.table.rows
    const sheetBody: PointDataRowInSheet[] = sheetData.filter((row, index) => row.c[0]?.v !== '落點名稱')
    const mapping: PointFromSheet[] = this.formatingPointData(sheetBody)
    return mapping
  })

  formatingPointData = (sheetBody: PointDataRowInSheet[]):PointFromSheet[] => {
    return sheetBody.map((row, index) => {
      let title = ""
      let address = ""
      if (row.c) {
        title = row.c[0].v
        address = row.c[1].v
      }
      return {
        id: index,
        title: title,
        address: address,
      }
    })
  }

  removeExtraText = (text:string) => {
    const tokenToReplaceOnStart = `/*O_o*/\ngoogle.visualization.Query.setResponse(`
    const tokenToReplaceOnend = `);`
    return text.replace(tokenToReplaceOnStart, '').replace(tokenToReplaceOnend, '')
  }

  convertAddressToRawGeoencoding = mergeMap( (next: PointFromSheet[]): Observable<PointDataMappingGeoencodingRaw[]>=> {
    let allRequests = next.map(pointData => {
      const encodedAddress = encodeURIComponent(pointData.address)
      const request = this.getGeoLonLat(encodedAddress, pointData)
      return request
    });
    const groups = this.groupRequest(allRequests)
    return from(groups).pipe( concatMap( forEachGroup => forkJoin(forEachGroup)))
  })

  groupRequest = (rqs:Observable<PointDataMappingGeoencodingRaw>[]): Observable<PointDataMappingGeoencodingRaw>[][] => {
    const groups = []        
    for (let i = 0; i < rqs.length; i+=10) {
      const emptyGroup = new Array(10).fill(i)
      const mappedGroup = emptyGroup.map( (groupId, index) => rqs[groupId + index])
      const solidGroup = mappedGroup.filter( (rq) => Boolean(rq) )
      groups.push(solidGroup)
    }
    return groups
  }


  getGeoLonLat = (address: string, pointData: PointFromSheet): Observable<PointDataMappingGeoencodingRaw> => {
    return this.httpClient.get<GeoencodingRaw>(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAAQr-IWEpmXbcOk3trYWMMcasLuIBZ280`)
    .pipe( map( raw => {return {geoencodingRaw: raw, pointData}}))
  }

  convertGoogleGeoencodingToLonLat = map( (points: PointDataMappingGeoencodingRaw[]): PointDataMappingLonLat[] => {
    return points.map( point => {
      const location = point.geoencodingRaw.results[0].geometry.location      
      return {lonLat: new Vector2(location.lng, location.lat), pointData: point.pointData}
    })
})

}
