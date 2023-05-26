import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsStructureFacilityComponent } from './settings-structure-facility.component';

describe('SettingsStructureFacilityComponent', () => {
  let component: SettingsStructureFacilityComponent;
  let fixture: ComponentFixture<SettingsStructureFacilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsStructureFacilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsStructureFacilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
