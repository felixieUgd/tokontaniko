import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelNoteComponent } from './side-panel-note.component';

describe('SidePanelNoteComponent', () => {
  let component: SidePanelNoteComponent;
  let fixture: ComponentFixture<SidePanelNoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidePanelNoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidePanelNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
