import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOutSearchComponent } from './inventory-out-search.component';

describe('InventoryOutSearchComponent', () => {
  let component: InventoryOutSearchComponent;
  let fixture: ComponentFixture<InventoryOutSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryOutSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryOutSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
