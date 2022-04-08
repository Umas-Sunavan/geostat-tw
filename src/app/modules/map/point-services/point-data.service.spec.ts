import { TestBed } from '@angular/core/testing';

import { PointDataService } from './point-data.service';

describe('PointDataService', () => {
  let service: PointDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PointDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
