import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { delay, Observable, of, Subject, switchMap, take } from 'rxjs';
import { AnimateService } from 'src/app/modules/map/map-viewer/map-canvas/three-services/animate.service';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.sass']
})
export class AddCategoryComponent implements OnInit {

  constructor(
    private animateService:AnimateService
  ) { }

  ngOnInit(): void {
    this.checkUrlAccessable.pipe( switchMap( url => of('posted'))).subscribe( output => {
      console.log('posted')
    })
  }

  showTip: boolean = false
  isComponentShow: boolean = false
  blurSource: string = ''
  sheetUrl: string = ''
  checkUrlAccessable: Subject<any> = new Subject()
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

  changeUrl = (url:string) => {
    console.log(url);
    
  }

  urlKeyUp = (event: Event, url: string, isGoogleSheet: any) => {
    
    console.log(event, url, isGoogleSheet);
    if(isGoogleSheet) {
      this.checkUrlAccessable.next(url)
    }
  }
}
