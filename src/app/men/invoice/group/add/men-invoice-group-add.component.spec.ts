import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenInvoiceGroupAddComponent } from './men-invoice-group-add.component';

describe('MenInvoiceGroupAddComponent', () => {
  let component: MenInvoiceGroupAddComponent;
  let fixture: ComponentFixture<MenInvoiceGroupAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenInvoiceGroupAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenInvoiceGroupAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
