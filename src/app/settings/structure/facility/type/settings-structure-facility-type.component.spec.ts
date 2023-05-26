import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsStructureFacilityTypeComponent } from './settings-structure-facility-type.component';

describe('SettingsStructureFacilityTypeComponent', () => {
  let component: SettingsStructureFacilityTypeComponent;
  let fixture: ComponentFixture<SettingsStructureFacilityTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsStructureFacilityTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsStructureFacilityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
