import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryReportListComponent } from './inventory-report-list.component';

describe('InventoryReportListComponent', () => {
  let component: InventoryReportListComponent;
  let fixture: ComponentFixture<InventoryReportListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryReportListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
