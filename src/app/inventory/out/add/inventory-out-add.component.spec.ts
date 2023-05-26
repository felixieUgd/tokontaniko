import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOutAddComponent } from './inventory-out-add.component';

describe('InventoryOutAddComponent', () => {
  let component: InventoryOutAddComponent;
  let fixture: ComponentFixture<InventoryOutAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOutAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOutAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
