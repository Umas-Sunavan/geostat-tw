import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Pin } from 'src/app/shared/models/Pin';

@Component({
  selector: 'app-map-pin-settings',
  templateUrl: './map-pin-settings.component.html',
  styleUrls: ['./map-pin-settings.component.sass']
})
export class MapPinSettingsComponent implements OnInit {

  constructor() { }
  pins: Pin[] = []
  unselectedPins: Pin[] = []
  selectedPins: Pin[] = []
  @Input() blurSource:string = ''
  @Input() set setSelectedPins(pins: Pin[]) {   
    console.log('pins set');
     
    this.selectedPins = pins
    this.updateUnselected()    
  }
  @Input() set setPins(pins:Pin[]) {
    this.pins = pins
    this.updateUnselected()
  }
  @Output() onPinChecked: EventEmitter<Pin[]> = new EventEmitter()

  ngOnInit(): void {
    
  }

  updateUnselected = () => {
    const unselectedPins = this.pins.filter( pin => {
      const hasPin = this.selectedPins?.some( selectedPin => selectedPin.id === pin.id)
      return !hasPin
    })
    this.unselectedPins = unselectedPins
  }

  uncheckPin = (uncheckPin: Pin) => {
    this.selectedPins = this.selectedPins.filter( pin => pin.id !== uncheckPin.id)
    this.updateUnselected()
    this.onPinChecked.emit(this.selectedPins)
  }

  checkPin = (pin: Pin) => {
    this.selectedPins?.push(pin)
    this.updateUnselected()    
    console.log(this.selectedPins);
    
    this.onPinChecked.emit(this.selectedPins)
  }

}
