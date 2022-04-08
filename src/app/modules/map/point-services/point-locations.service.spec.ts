import { TestBed } from '@angular/core/testing';

import { PointLocationsService } from './point-locations.service';

describe('PointDataService', () => {
  let service: PointLocationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PointLocationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
