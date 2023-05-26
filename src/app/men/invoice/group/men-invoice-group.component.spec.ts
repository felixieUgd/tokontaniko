import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenInvoiceGroupComponent } from './men-invoice-group.component';

describe('MenInvoiceGroupComponent', () => {
  let component: MenInvoiceGroupComponent;
  let fixture: ComponentFixture<MenInvoiceGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenInvoiceGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenInvoiceGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
