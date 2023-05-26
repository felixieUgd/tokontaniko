import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOutDetailComponent } from './inventory-out-detail.component';

describe('InventoryOutDetailComponent', () => {
  let component: InventoryOutDetailComponent;
  let fixture: ComponentFixture<InventoryOutDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOutDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOutDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
