import { TestBed } from '@angular/core/testing';

import { SettingsGeographyService } from './settings-geography.service';

describe('SettingsGeographyService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SettingsGeographyService = TestBed.get(SettingsGeographyService);
    expect(service).toBeTruthy();
  });
});
