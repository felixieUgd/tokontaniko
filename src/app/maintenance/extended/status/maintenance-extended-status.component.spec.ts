import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceExtendedStatusComponent } from './maintenance-extended-status.component';

describe('MaintenanceExtendedStatusComponent', () => {
  let component: MaintenanceExtendedStatusComponent;
  let fixture: ComponentFixture<MaintenanceExtendedStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaintenanceExtendedStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceExtendedStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
