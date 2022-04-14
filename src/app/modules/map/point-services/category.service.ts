import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';
import { getDatabase, ref, onValue, Database, push } from "firebase/database";
import { environment } from 'src/environments/environment';
import { map, Observable } from 'rxjs';
import { CategorySettings } from 'src/app/shared/models/CategorySettings';
import { HttpClient } from '@angular/common/http';
import { GoogleSheetRawData, GoogleSheetRow } from 'src/app/shared/models/GoogleSheetRawData';
import { GoogleSheetPin } from 'src/app/shared/models/GoogleSheetPin';
import { PinsTableService } from './pins-table.service';
import { CategoryTableRow } from 'src/app/shared/models/CategoryTableRow';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(
    private httpClient: HttpClient,
    private pointLocationsService: PinsTableService,
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

  getCategorySettings = ():Observable<CategorySettings> => {
    const starCountRef = ref(this.dataBase, '/pointTables');
    return new Observable(subscribe => {
      onValue(starCountRef, (snapshot) => {
        const data:CategorySettings = snapshot.val();
        subscribe.next(data)
      });
    })
  }

  getCategoryTable = (googleSheetId: string): Observable<CategoryTableRow[]> => {
    const options = {responseType: 'text' as 'json',};
    return this.httpClient.get<GoogleSheetRawData>(`https://docs.google.com/spreadsheets/d/${googleSheetId}/gviz/tq?`, options).pipe(
      this.convertGoogleSheetToAddress,
    )
  }
  
  convertGoogleSheetToAddress = map((rawdata): CategoryTableRow[] => {
    rawdata = this.pointLocationsService.removeExtraText(rawdata as string)    
    const raw = <GoogleSheetRawData>JSON.parse(rawdata as string)    
    const sheetData: GoogleSheetRow[] = raw.table.rows
    const sheetBody: GoogleSheetRow[] = sheetData.filter((row, index) => row.c[0]?.v !== '落點名稱')
    const mapping: CategoryTableRow[] = this.formatingPointDimensionData(sheetBody)
    return mapping
  })

  formatingPointDimensionData = (sheetBody: GoogleSheetRow[]):CategoryTableRow[] => {
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
          value: dimensionData,
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
