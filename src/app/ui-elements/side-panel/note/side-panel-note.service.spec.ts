import { TestBed } from '@angular/core/testing';

import { SidePanelNoteService } from './side-panel-note.service';

describe('SidePanelNoteService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SidePanelNoteService = TestBed.get(SidePanelNoteService);
    expect(service).toBeTruthy();
  });
});
