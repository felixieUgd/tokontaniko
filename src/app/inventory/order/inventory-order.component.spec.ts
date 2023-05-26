import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOrderComponent } from './inventory-order.component';

describe('InventoryOrderComponent', () => {
  let component: InventoryOrderComponent;
  let fixture: ComponentFixture<InventoryOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
