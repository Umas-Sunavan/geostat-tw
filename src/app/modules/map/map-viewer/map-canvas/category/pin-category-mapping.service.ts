import { Injectable } from '@angular/core';
import { CategoryTableRow } from 'src/app/shared/models/CategoryTableRow';
import { Pin } from 'src/app/shared/models/Pin';

@Injectable({
  providedIn: 'root'
})
export class PinCategoryMappingService {

  constructor() { }

  mappingPinAndTable = (table: CategoryTableRow[], pins: Pin[]) => {
    const unmappedPins = this.filterMappedPins(table, pins, true)
    const unmappedRows = this.filterMappedRows(table, pins, true)
    const unmappedCount = [...unmappedPins, ...unmappedRows].length
    if(unmappedCount){
      // console.error("Unmapped pins or category rows detected");
    } 
    const mappedPins = this.filterMappedPins(table, pins, false)
    const mappedRows = this.filterMappedRows(table, pins, false)    
    return {mappedPins, mappedRows}
  }

  filterMappedRows = (table: CategoryTableRow[], pins: Pin[], filterUnmapped: boolean) => {
    const unmappedRow = table.filter( row => {      
      const rowExistsInPin = pins.some( pin => pin.title === row.title)
      return filterUnmapped ? !rowExistsInPin : rowExistsInPin
    })
    return unmappedRow
  }

  filterMappedPins = (rows: CategoryTableRow[], pins: Pin[], filterUnmapped: boolean) => {
    const unmappedPin = pins.filter( pin => {
      const pinExistsInRow = rows.some( row => pin.title === row.title)
      return filterUnmapped ? !pinExistsInRow : pinExistsInRow
    })
    return unmappedPin
  }

}
