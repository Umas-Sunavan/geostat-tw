/// <reference types="@types/gapi.client.sheets" />
/// <reference types="@types/gapi.client.drive" />
/// <reference types="@types/gapi.auth2" />
/// <reference types="@types/google-one-tap" />

import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { BehaviorSubject, catchError, debounceTime, delay, Observable, of, Subject, switchMap, take, timeout } from 'rxjs';
import { CategoryService } from 'src/app/modules/map/map-viewer/map-canvas/category/category.service';
import { AnimateService } from 'src/app/modules/map/map-viewer/map-canvas/three-services/animate.service';
import { Object3D } from 'three';
import {} from 'googleapis'
import { GoogleAuth } from 'google-auth-library';
// import * as google from 'google-one-tap';

@Component({
  selector: 'add-pin-sheet-component',
  templateUrl: './add-pin-sheet.component.html',
  styleUrls: ['./add-pin-sheet.component.sass']
})


export class AddPinSheetComponent implements OnInit {

  constructor(
    private animateService: AnimateService,
    private categoryService: CategoryService,
  ) { }

  gapiLoaded = () => {
    const _intializeGapiClient = async () => {
      await gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: this.DISCOVERY_DOC,
      })
      this.gapiInited = true;
    }
    gapi.load('client', _intializeGapiClient);
  }
 
  gisLoaded = () => {
    // @ts-ignore
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      callback: '', // defined later
    });
    this.gisInited = true;
  }

  ngOnInit(): void {
    this.gapiLoaded()
    this.gisLoaded()
  }

  blurSource: string = ''
  popupBgClass = 'bg-white/10'
  isGenerating = true
  isEditing = false
  isAuthorizing = false
  isClickedSheetUrl = false
  onKeyChange: Subject<any> = new Subject()
  @Output() onSubmit: EventEmitter<string> = new EventEmitter()
  @Output() setHide: EventEmitter<undefined> = new EventEmitter()
  @Input() set useBlurPadding(enable: boolean) { this.loadBlurSource(false) }
  @Input() set setPopupBg(className: string) { this.popupBgClass = className }
  @Input() mapName!: string

  hide = () => this.setHide.emit()

  loadBlurSource = (enable: boolean) => {
    if (enable) {
      this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
        this.blurSource = `url(${value})`
      })
    } else {
      this.blurSource = '#ffffff'
    }
  }

  // sheet API

  signoutShow = false
  authorizeShow = false
  gapiInited = false;
  gisInited = false;
  tokenClient?: any;
  DISCOVERY_DOC = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
  API_KEY = '';
  CLIENT_ID = '';
  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
  sheetId: string = ''

  /**
   *  Sign in the user upon button click.
   */
  handleAuthClick = () => {
    this.tokenClient.callback = async (resp:any) => {
      if (resp.error !== undefined) {

        throw (resp);
      }
      this.signoutShow = true
      this.authorizeShow = true
      await this.listMajors();
    };

    if (gapi.client.getToken() === null) {      
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  exampleContent = ''

  pastSheetInitData: gapi.client.sheets.Request[] = [
    { 
     pasteData: {
      data: '落點名稱',
      type: "PASTE_NORMAL",
      delimiter: ",",
      coordinate: {
        sheetId: 0,
        rowIndex: 0,
        columnIndex: 0
        }
      }
    },
    { 
     pasteData: {
      data: '落點地址',
      type: "PASTE_NORMAL",
      delimiter: ",",
      coordinate: {
        sheetId: 0,
        rowIndex: 0,
        columnIndex: 1
        }
      }
    },
    { 
     pasteData: {
      data: '範例落點',
      type: "PASTE_NORMAL",
      delimiter: ",",
      coordinate: {
        sheetId: 0,
        rowIndex: 1,
        columnIndex: 0
        }
      }
    },
    { 
     pasteData: {
      data: '台北市中華路二段56號',
      type: "PASTE_NORMAL",
      delimiter: ",",
      coordinate: {
        sheetId: 0,
        rowIndex: 1,
        columnIndex: 1
        }
      }
  }]

  formatSheetHeaderRow: gapi.client.sheets.Request[] = [
    {
      "repeatCell": {
        "range": {
          "sheetId": 0,
          "startRowIndex": 0,
          "endRowIndex": 1,
          "startColumnIndex": 0,
          "endColumnIndex":2
        },
        "cell": {
          "userEnteredFormat": {
            "backgroundColor": {
              "red": 37/256,
              "green": 85/256,
              "blue": 122/256
            },
            "horizontalAlignment" : "CENTER",
            "textFormat": {
              "foregroundColor": {
                "red": 1,
                "green": 1,
                "blue": 1
              },
              "fontSize": 12,
              "bold": true
            }
          }
        },
        "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
      }
    },
  ]

  formatSheetBodyRows: gapi.client.sheets.Request[] = [ 
    {
      "repeatCell": {
        "range": {
          "sheetId": 0,
          "startRowIndex": 1,
          "endRowIndex": 99,
          "startColumnIndex": 0,
          "endColumnIndex":2
        },
        "cell": {
          "userEnteredFormat": {
            "backgroundColor": {
              "red": 243/256,
              "green": 243/256,
              "blue": 243/256
            },
            "horizontalAlignment" : "LEFT",
            "textFormat": {
              "foregroundColor": {
                "red": 0,
                "green": 0,
                "blue": 0
              },
              "fontSize": 11,
              "bold": false
            }
          }
        },
        "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
      }
    },
  ]

  changeCellWidth: gapi.client.sheets.Request[] = [ 
    {
      "updateDimensionProperties": {
        "properties": {
          "pixelSize": 300,
        },
        "fields": "*",
      
        // Union field dimension_range can be only one of the following:
        "range": {
          "sheetId": 0,
          "dimension": "COLUMNS", 
          "startIndex": 1,
          "endIndex":2
        }
        // End of list of possible types for union field dimension_range.
      }
    },
  ]

  freezeHeaderRow: gapi.client.sheets.Request[] = [ 
    {
      "updateSheetProperties": {
        "properties": {
          "sheetId": 0,
          "gridProperties": {
            "frozenRowCount": 1,
          }
        },
        "fields": "gridProperties.frozenRowCount"
      }
    }
  ]

  batchUpdateCellData = (response:gapi.client.Response<gapi.client.sheets.Spreadsheet>) => {
    var params = {spreadsheetId: response.result.spreadsheetId!}
    var batchUpdateSpreadsheetRequestBody:gapi.client.sheets.BatchUpdateSpreadsheetRequest = {
      requests: [
        ...this.pastSheetInitData,
        ...this.formatSheetHeaderRow,
        ...this.formatSheetBodyRows,
        ...this.changeCellWidth,
        ...this.freezeHeaderRow
     ]
    };
    return gapi.client.sheets.spreadsheets.batchUpdate(params, batchUpdateSpreadsheetRequestBody)
  }

  saveSheetId = (response:gapi.client.Response<gapi.client.sheets.Spreadsheet>) => {
    if( !response.result.spreadsheetId ) throw console.error("no sheet id found")
    this.sheetId = response.result.spreadsheetId
    return response
  }

  createPermission = (response:gapi.client.Response<gapi.client.sheets.Spreadsheet>) => {
    const fileId = response.result.spreadsheetId
    if (!fileId) throw new Error("no sheet file id found when creating file permission");
    const body = {
      "role": "writer",
      "type": "anyone"
    }
    return gapi.client.drive.permissions.create({ fileId }, body)
  }

  listMajors = async () => {
    this.isAuthorizing = true
    // let response;
    try {
      gapi.client.sheets.spreadsheets.create({
        // @ts-ignore
        properties: {
          title: `${this.mapName}的地址資料`
        }
      })
        .then( response => this.saveSheetId(response))
        .then( response => this.batchUpdateCellData(response))
        .then( response => this.createPermission(response))
        .then( response => {
          console.log(response.result.permissionDetails);
          this.isGenerating = false
          this.isEditing = true
          this.isAuthorizing = false
        })
        .catch( error => {
          this.isAuthorizing = false
          console.log(error);
          
        })
    //   response = await gapi.client.sheets.spreadsheets.values.get({
    //     spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    //     range: 'Class Data!A2:E',
    //   });
    } catch (err:any) {
      this.exampleContent = err.message;
      return;
    }
    // const range = response.result;
    // if (!range || !range.values || range.values.length == 0) {
    //   this.exampleContent = 'No values found.';
    //   return;
    // }
    // // Flatten to string to display
    // const output = range.values.reduce(
    //     (str:any, row:any) => `${str}${row[0]}, ${row[4]}\n`,
    //     'Name, Major:\n');
    // this.exampleContent = output;
  }
}
