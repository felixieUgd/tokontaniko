import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOrderSearchComponent } from './inventory-order-search.component';

describe('InventoryOrderSearchComponent', () => {
  let component: InventoryOrderSearchComponent;
  let fixture: ComponentFixture<InventoryOrderSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOrderSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOrderSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
