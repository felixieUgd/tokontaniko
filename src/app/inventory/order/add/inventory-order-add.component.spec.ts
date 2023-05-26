import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOrderAddComponent } from './inventory-order-add.component';

describe('InventoryOrderAddComponent', () => {
  let component: InventoryOrderAddComponent;
  let fixture: ComponentFixture<InventoryOrderAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOrderAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOrderAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
