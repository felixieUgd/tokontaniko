import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelFacilityAddComponent } from './side-panel-facility-add.component';

describe('SidePanelFacilityAddComponent', () => {
  let component: SidePanelFacilityAddComponent;
  let fixture: ComponentFixture<SidePanelFacilityAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidePanelFacilityAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidePanelFacilityAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
