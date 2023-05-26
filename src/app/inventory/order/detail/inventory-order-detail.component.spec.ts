import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOrderDetailComponent } from './inventory-order-detail.component';

describe('InventoryOrderDetailComponent', () => {
  let component: InventoryOrderDetailComponent;
  let fixture: ComponentFixture<InventoryOrderDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOrderDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
