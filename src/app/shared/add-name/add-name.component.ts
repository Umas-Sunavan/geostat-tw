import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { take } from 'rxjs';
import { AnimateService } from 'src/app/modules/map/map-viewer/map-canvas/three-services/animate.service';

@Component({
  selector: 'app-add-name',
  templateUrl: './add-name.component.html',
  styleUrls: ['./add-name.component.sass']
})
export class AddNameComponent implements OnInit {

  constructor(
    private animateService: AnimateService
  ) { }

  blurSource: string = ''
  nameString: string = ''
  @Output()     setHide = new EventEmitter<boolean>()
  @Input() set  setShow(isShow: boolean) {this.onShow(isShow)}
  @Output()     onSubmit = new EventEmitter<string>()

  ngOnInit(): void {
  }

  hide = () => {
    this.setHide.next(true)
    this.blurSource = ''
  }

  onShow = (isShow: boolean) => {
    this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
      this.blurSource = `url(${value})`
    })
  }

  submit = (errors: ValidationErrors | null) => {
    if (errors) return
    this.onSubmit.next(this.nameString)
  }

}
