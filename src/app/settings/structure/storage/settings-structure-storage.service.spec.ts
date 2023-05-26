import { TestBed } from '@angular/core/testing';

import { SettingsStructureStorageService } from './settings-structure-storage.service';

describe('SettingsStructureStorageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SettingsStructureStorageService = TestBed.get(SettingsStructureStorageService);
    expect(service).toBeTruthy();
  });
});
