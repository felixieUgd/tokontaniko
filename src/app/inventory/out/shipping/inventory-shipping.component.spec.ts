import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryShippingComponent } from './inventory-shipping.component';

describe('InventoryShippingComponent', () => {
  let component: InventoryShippingComponent;
  let fixture: ComponentFixture<InventoryShippingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryShippingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryShippingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
