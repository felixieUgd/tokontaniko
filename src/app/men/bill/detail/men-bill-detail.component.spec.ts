import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenBillDetailComponent } from './men-bill-detail.component';

describe('MenBillDetailComponent', () => {
  let component: MenBillDetailComponent;
  let fixture: ComponentFixture<MenBillDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenBillDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenBillDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
