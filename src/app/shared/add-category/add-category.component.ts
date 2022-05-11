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
    this.checkUrlAccessable()
  }

  showSubmitTip: boolean = false
  googleSheetErrorDscription: string = ''
  showTip: boolean = false
  blurSource: string = ''
  sheetUrl: string = ''
  onKeyChange: Subject<any> = new Subject()
  @Output() onSubmit: EventEmitter<string> = new EventEmitter()
  @Output() setHide: EventEmitter<undefined> = new EventEmitter()
  @Input() set setShow( isShow: boolean) {
    this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
      this.blurSource = `url(${value})`
    })
  }

  toggleShowTip = () => this.showTip = !this.showTip

  hide = () => this.setHide.emit()

  urlKeyUp = (event: Event, url: string, hasErrorBrforeKeyUp: any) => {
    if(!hasErrorBrforeKeyUp) {
      this.onKeyChange.next(url)
    }
  }

  checkUrlAccessable = () => {
    this.onKeyChange.pipe( debounceTime(500), switchMap( url => of(url))).subscribe( url => {
      this.categoryService.getCategoryTableByUrl(url).subscribe( statusCode => {
        console.log(statusCode);
        
        switch (statusCode) {
          case 401:
            this.googleSheetErrorDscription = '請依照下一步，設定試算表為公開。'
            break;
          case 404:
            this.googleSheetErrorDscription = '超連結裡面沒有試算表，該試算表是否已被刪除？'
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

  getSheetId = () => {
    const idArray:RegExpMatchArray | null = this.sheetUrl.match(/(?<=\/d\/).+(?=\/)/g)
    if (idArray && idArray[0]) {
      return idArray[0]
    } else {
      throw new Error("No id found");
    }
  }

  submit = (hasErrors: any) => {
    if (hasErrors) return
    this.showSubmitTip = true
    this.onSubmit.next(this.sheetUrl)
    this.hide()
  }
}
