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
    private zone: NgZone,
    private http: HttpClient
  ) { }


  public authIsLoaded: boolean = false;
  public isLoggedIn: boolean = false;
  public user: any;

  signInComponent(): void {
    this.signIn();
  };

  signOutComponent(): void {
    this.signOut();
  }

  ngOnInitComponent() {

  }

  ngOnInit(): void {
    this.checkUrlAccessable()
    // this.initOAuth2()
    this.gapiLoaded()
    this.gisLoaded()
    // this.isLoaded$.subscribe(value => {
    //   this.authIsLoaded = value;
    // });

    // this.isLoggedIn$.subscribe(value => {
    //   this.isLoggedIn = value;
    // });

    // this.user$.subscribe(value => {
    //   this.user = value;
    // });

    // this.loadAuth2();
  }

  showSubmitTip: boolean = false
  googleSheetErrorDscription: string = ''
  googleSheetSuccessDscription: string = ''
  showTip: boolean = false
  blurSource: string = ''
  sheetUrl: string = ''
  popupBgClass = 'bg-white/10'
  onKeyChange: Subject<any> = new Subject()
  @Output() onSubmit: EventEmitter<string> = new EventEmitter()
  @Output() setHide: EventEmitter<undefined> = new EventEmitter()
  @Input() set useBlurPadding(enable: boolean) { this.loadBlurSource(false) }
  @Input() set setPopupBg(className: string) { this.popupBgClass = className }
  @Input() mapName!: string


  toggleShowTip = () => this.showTip = !this.showTip

  hide = () => this.setHide.emit()

  urlKeyUp = (event: Event, url: string, hasErrorBrforeKeyUp: any) => {
    if (!hasErrorBrforeKeyUp) {
      this.onKeyChange.next(url)
    }
  }

  loadBlurSource = (enable: boolean) => {
    if (enable) {
      this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
        this.blurSource = `url(${value})`
      })
    } else {
      this.blurSource = '#ffffff'
    }
  }

  checkUrlAccessable = () => {
    this.onKeyChange.pipe(debounceTime(500), switchMap(url => of(url))).subscribe(url => {
      this.categoryService.getCategoryTableByUrl(url).subscribe(statusCode => {
        console.log(statusCode);

        switch (statusCode) {
          case 401:
            this.googleSheetErrorDscription = '請依照下一步，設定試算表為公開。'
            this.googleSheetSuccessDscription = ''
            break;
          case 404:
            this.googleSheetErrorDscription = '超連結裡面沒有試算表，該試算表是否已被刪除？'
            this.googleSheetSuccessDscription = ''
            break;
          case 0:
            this.googleSheetErrorDscription = '請依照下一步，設定試算表為公開。'
            this.googleSheetSuccessDscription = ''
            break;
          case 200:
            this.googleSheetErrorDscription = ''
            this.googleSheetSuccessDscription = '試算表沒有問題，讚！'
            break;
          default:
            break;
        }
      })
    })
  }

  getSheetId = () => {
    return this.categoryService.getSheetIdFromUrl(this.sheetUrl)
  }

  submit = (hasErrors: any, urlInvalid: string) => {
    if (hasErrors || urlInvalid) return
    this.showSubmitTip = true
    this.onSubmit.next(this.sheetUrl)
    this.hide()
  }

  createNewPinSheet = () => {
    console.log('createNewPinSheet');

  }





  public auth2: any;
  public user$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public isLoggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  validateToken(token: string): Observable<any> {
    return this.http.get<any>(`http://yourServer:3000/validationApi/${token}`);
  }

  signIn(): void {
    this.auth2.signIn().then((user: any) => {
      this.validateToken(user.getAuthResponse().id_token).subscribe(user => {
        this.zone.run(() => {
          this.user$.next(user);
          this.isLoggedIn$.next(true);
        });
      },
        (err) => {
          console.error(err);
        });
    });
  };

  signOut(): void {
    this.auth2.signOut().then(() => {
      this.zone.run(() => {
        this.isLoggedIn$.next(false);
        this.user$.next(null);
      });
    },
      (err: any) => {
        console.error(err);
      });
  }

  loadAuth2(): void {
    gapi.load('auth2', () => {
      gapi.auth2.init({
        client_id: '349482155640-denm4e3bg0eseughru3krlrlocgjdghj.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        fetch_basic_profile: true
      }).then((auth: any) => {
        this.zone.run(() => {
          this.auth2 = auth;
          this.isLoaded$.next(true);
        });
      },
      );
    });
  }

  gapiInited = false;
  gisInited = false;
  tokenClient?: any;
  DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
  API_KEY = 'AIzaSyDkNXYD5Hmohj4E9sJ6yhzI7zTVipIowDE';
  CLIENT_ID = '349482155640-denm4e3bg0eseughru3krlrlocgjdghj.apps.googleusercontent.com';
  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly';

  intializeGapiClient = async () => {
    // Discovery doc URL for APIs used by the quickstart
    await gapi.client.init({
      apiKey: this.API_KEY,
      discoveryDocs: [this.DISCOVERY_DOC],
    });
    this.gapiInited = true;
  }


  gapiLoaded = () => {
    gapi.load('client', this.intializeGapiClient);
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

  exampleContent = ''

  batchUpdateCellData = (response:gapi.client.Response<gapi.client.sheets.Spreadsheet>) => {
    console.log('response.result.spreadsheetUrl', response.result.spreadsheetId);
    console.log('response.result.spreadsheetUrl', response.result.spreadsheetUrl);
    var params = {
      // The spreadsheet to apply the updates to.
      spreadsheetId: response.result.spreadsheetId!,  // TODO: Update placeholder value.
    };
    var batchUpdateSpreadsheetRequestBody:gapi.client.sheets.BatchUpdateSpreadsheetRequest = {
      // A list of updates to apply to the spreadsheet.
      // Requests will be applied in the order they are specified.
      // If any request is not valid, no requests will be applied.
      requests: [
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
        },
        {
          "repeatCell": {
            "range": {
              "sheetId": +response.result.spreadsheetId!,
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
        {
          "repeatCell": {
            "range": {
              "sheetId": +response.result.spreadsheetId!,
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
        {
          "updateDimensionProperties": {
            "properties": {
              "pixelSize": 300,
            },
            "fields": "*",
          
            // Union field dimension_range can be only one of the following:
            "range": {
              "sheetId": +response.result.spreadsheetId!,
              "dimension": "COLUMNS", 
              "startIndex": 1,
              "endIndex":2
            }
            // End of list of possible types for union field dimension_range.
          }
        },
        {
          "updateSheetProperties": {
            "properties": {
              "sheetId": +response.result.spreadsheetId!,
              "gridProperties": {
                "frozenRowCount": 1,
              }
            },
            "fields": "gridProperties.frozenRowCount"
          }
        }
        
     ]

      // TODO: Add desired properties to the request body.
    };
    return gapi.client.sheets.spreadsheets.batchUpdate(params, batchUpdateSpreadsheetRequestBody)
  }

  listMajors = async () => {
    let response;
    try {
      // Fetch first 10 files
      gapi.client.sheets.spreadsheets.create({
        // @ts-ignore
        properties: {
          title: `${this.mapName}的地址資料`
        }
      })
        .then( sheet => this.batchUpdateCellData(sheet))
        // .then( sheet => {
        //   console.log(sheet.result.spreadsheetId);
        //   return gapi.client.drive.files.list({
        //     q: 'mimeType=\'application/vnd.google-apps.spreadsheet\'',
        //     pageSize: 100,
        //     fields: 'files(id, name)',
        //   })
        // })
        .then( result => {
          console.log(result.result.spreadsheetId);
          setInterval( ()=> {
            const params = {
              // The ID of the spreadsheet to retrieve data from.
              spreadsheetId: result.result.spreadsheetId!,  // TODO: Update placeholder value.
      
              // The A1 notation of the values to retrieve.
              range: 'Sheet1!A:B',  // TODO: Update placeholder value.
      
              // How values should be represented in the output.
              // The default render option is ValueRenderOption.FORMATTED_VALUE.
              valueRenderOption: 'FORMATTED_VALUE',  // TODO: Update placeholder value.
      
              // How dates, times, and durations should be represented in the output.
              // This is ignored if value_render_option is
              // FORMATTED_VALUE.
              // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
              dateTimeRenderOption: 'FORMATTED_STRING',  // TODO: Update placeholder value.
            };
            const request = gapi.client.sheets.spreadsheets.values.get(params);
            request.then( res => {
              console.log(res);
              
            })

          } , 5000)
        })

      // gapi.client.drive.files.list({
      //   'pageSize': 10,
      //   'fields': 'files(id, name)',
      // }).then( result =>{
      //   console.log(result);
        
      // })
      response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        range: 'Class Data!A2:E',
      });
    } catch (err:any) {
      this.exampleContent = err.message;
      return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
      this.exampleContent = 'No values found.';
      return;
    }
    // Flatten to string to display
    const output = range.values.reduce(
        (str:any, row:any) => `${str}${row[0]}, ${row[4]}\n`,
        'Name, Major:\n');
    this.exampleContent = output;
  }

  signoutShow = false
  authorizeShow = false

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
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }
}
