import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { take } from 'rxjs';
import { AnimateService } from 'src/app/modules/map/map-viewer/map-canvas/three-services/animate.service';

@Component({
  selector: 'app-completed',
  templateUrl: './completed.component.html',
  styleUrls: ['./completed.component.sass']
})
export class CompletedComponent implements OnInit {

  constructor(
    private animateService: AnimateService
  ) { }
  blurSource: string = ''
  @Input() set setShow(isShow: boolean) { this.onShow() }
  @Output() setHide = new EventEmitter<boolean>()
  @Output() onSubmit = new EventEmitter<boolean>()
  @Input() name: string = ''

  ngOnInit(): void {
  }

  submit = () => {
    this.hide()
    this.onSubmit.next(true)
  }

  hide = () => {
    this.setHide.next(true)
  }

  onShow = () => {
    this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
      this.blurSource = `url(${value})`
    })
  }

}
