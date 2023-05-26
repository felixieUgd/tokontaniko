import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryEntryDetailComponent } from './inventory-entry-detail.component';

describe('InventoryEntryDetailComponent', () => {
  let component: InventoryEntryDetailComponent;
  let fixture: ComponentFixture<InventoryEntryDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryEntryDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryEntryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
