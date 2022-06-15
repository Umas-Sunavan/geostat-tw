import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPinSheetComponent } from './add-pin-sheet.component';

describe('AddPinSheetComponent', () => {
  let component: AddPinSheetComponent;
  let fixture: ComponentFixture<AddPinSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPinSheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPinSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
