import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceExtendedTypeComponent } from './maintenance-extended-type.component';

describe('MaintenanceExtendedTypeComponent', () => {
  let component: MaintenanceExtendedTypeComponent;
  let fixture: ComponentFixture<MaintenanceExtendedTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaintenanceExtendedTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceExtendedTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
