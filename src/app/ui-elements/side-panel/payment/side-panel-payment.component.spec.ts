import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelPaymentComponent } from './side-panel-payment.component';

describe('SidePanelPaymentComponent', () => {
  let component: SidePanelPaymentComponent;
  let fixture: ComponentFixture<SidePanelPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidePanelPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidePanelPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
