import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenInvoiceGroupDetailComponent } from './men-invoice-group-detail.component';

describe('MenInvoiceGroupDetailComponent', () => {
  let component: MenInvoiceGroupDetailComponent;
  let fixture: ComponentFixture<MenInvoiceGroupDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenInvoiceGroupDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenInvoiceGroupDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
