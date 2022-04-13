import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';
import { getDatabase, ref, onValue, Database, push } from "firebase/database";
import { environment } from 'src/environments/environment';
import { map, Observable } from 'rxjs';
import { GoogleSheetPointDimension as pointDimensionMeta } from 'src/app/shared/models/GoogleSheetPointDimension';
import { HttpClient } from '@angular/common/http';
import { GoogleSheetRawData, GoogleSheetRow } from 'src/app/shared/models/GoogleSheetRawData';
import { GoogleSheetPin } from 'src/app/shared/models/PointFromSheet';
import { PointLocationsService } from './point-locations.service';
import { PointDimensionFromSheet } from 'src/app/shared/models/PointDimensionFromSheet';

@Injectable({
  providedIn: 'root'
})
export class PointDimensionService {

  constructor(
    private httpClient: HttpClient,
    private pointLocationsService: PointLocationsService,
  ) {
    this.firebaseConfig = environment.firebaseConfig
    this.dataBase = this.initFirebase()
  }

  firebaseConfig
  dataBase: Database

  initFirebase = () => {
    const firebaseApp = initializeApp(this.firebaseConfig);
    const database = getDatabase(firebaseApp);
    return database
  }

  loadDimensions = ():Observable<pointDimensionMeta> => {
    const starCountRef = ref(this.dataBase, '/pointTables');
    return new Observable(subscribe => {
      onValue(starCountRef, (snapshot) => {
        const data:pointDimensionMeta = snapshot.val();
        subscribe.next(data)
      });
    })
  }

  getGoogleSheetPointDimension = (googleSheetId: string): Observable<PointDimensionFromSheet[]> => {
    const options = {responseType: 'text' as 'json',};
    return this.httpClient.get<GoogleSheetRawData>(`https://docs.google.com/spreadsheets/d/${googleSheetId}/gviz/tq?`, options).pipe(
      this.convertGoogleSheetToAddress,
    )
  }

  convertAddressToMockGeoencoding = () => {

  }
  
  convertGoogleSheetToAddress = map((rawdata): PointDimensionFromSheet[] => {
    rawdata = this.pointLocationsService.removeExtraText(rawdata as string)    
    const raw = <GoogleSheetRawData>JSON.parse(rawdata as string)    
    const sheetData: GoogleSheetRow[] = raw.table.rows
    const sheetBody: GoogleSheetRow[] = sheetData.filter((row, index) => row.c[0]?.v !== '落點名稱')
    const mapping: PointDimensionFromSheet[] = this.formatingPointDimensionData(sheetBody)
    return mapping
  })

  formatingPointDimensionData = (sheetBody: GoogleSheetRow[]):PointDimensionFromSheet[] => {
      return sheetBody.map((row, index) => {
        let title = ""
        let dimensionData = ""
        if (row.c) {
          title = row.c[0].v
          dimensionData = row.c[1].v
        }
        return {
          id: index,
          title: title,
          dimensionData: dimensionData,
        }
      })
    }
  
  writeUserData = () => {
    push(ref(this.dataBase, '/pointTables'), {
      tableName: 'tableName',
      tableCreator: 'tableCreator',
      tableCreateDate: 'tableCreateDate',
      tableSource: 'url',
      deleted: true,
      options: {
        colors: {
          mainColor: '#ff00ff'
        },
        radius: 2,
        columnHeight: 1.5,
        focusOnPoint: { x: 0, y: 0, z: 0},
        cameraPosition: { x: 0, y: 0, z: 0},
        connectMode: 'triangle',
        connectedPoints: [1,2,4]
      }
    })
  }

}
