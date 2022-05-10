import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { catchError, debounceTime, delay, Observable, of, Subject, switchMap, take, timeout } from 'rxjs';
import { CategoryService } from 'src/app/modules/map/map-viewer/map-canvas/category/category.service';
import { AnimateService } from 'src/app/modules/map/map-viewer/map-canvas/three-services/animate.service';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.sass']
})
export class AddCategoryComponent implements OnInit {

  constructor(
    private animateService:AnimateService,
    private categoryService:CategoryService,
  ) { }

  ngOnInit(): void {
    this.checkUrlAccessable.pipe( debounceTime(500), switchMap( url => of(url))).subscribe( url => {
      this.categoryService.getCategoryTableByUrl(url).subscribe( statusCode => {
        switch (statusCode) {
          case 401:
            this.googleSheetErrorDscription = '沒有權限讀取試算表，您有設公開嗎？'
            break;
          case 0:
            this.googleSheetErrorDscription = '請貼上正確的試算表，或確保網路正常'
            break;
          case 200:
            this.googleSheetErrorDscription = ''
            break;
          default:
            break;
        } 
      })
    })
  }

  showSubmitTip: boolean = false
  googleSheetErrorDscription: string = ''
  showTip: boolean = false
  isComponentShow: boolean = false
  blurSource: string = ''
  sheetUrl: string = 'https://docs.google.com/spreadsheets/d/1rGYgg9SDkrafXSGpleAitmpaYMIUd_QNeDnogccZ0Fc/copy'
  checkUrlAccessable: Subject<any> = new Subject()
  @Output() onSubmit: EventEmitter<string> = new EventEmitter()
  @Output() showComponentEmitter: EventEmitter<undefined> = new EventEmitter()
  @Input() set setIsShow( isShow: boolean) {
    this.isComponentShow = isShow
    if (this.isComponentShow) {
      this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
        this.blurSource = `url(${value})`
      })
    }
  }

  toggleShowTip = () => this.showTip = !this.showTip

  toggleComponent = () => {
    this.showComponentEmitter.emit()
  }

  urlKeyUp = (event: Event, url: string, hasErrorBrforeKeyUp: any) => {
    console.log('keyup');
    
    if(!hasErrorBrforeKeyUp) {
      this.checkUrlAccessable.next(url)
    }
  }

  getSheetId = () => {
    const idArray:RegExpMatchArray | null = this.sheetUrl.match(/(?<=\/d\/).+(?=\/)/g)
    if (idArray && idArray[0]) {
      return idArray[0]
    } else {
      throw new Error("No id found");
    }
  }

  submit = (event: Event) => {
    this.showSubmitTip = true
    this.onSubmit.next(this.sheetUrl)
    this.toggleComponent()
  }
}
