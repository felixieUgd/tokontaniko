import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelContactComponent } from './side-panel-contact.component';

describe('SidePanelContactComponent', () => {
  let component: SidePanelContactComponent;
  let fixture: ComponentFixture<SidePanelContactComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidePanelContactComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidePanelContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
