import { TestBed } from '@angular/core/testing';

import { PointDimensionService } from './point-dimension.service';

describe('PointDimensionService', () => {
  let service: PointDimensionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PointDimensionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
