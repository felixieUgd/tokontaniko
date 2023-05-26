import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthConsultationAddComponent } from './health-consultation-add.component';

describe('HealthConsultationAddComponent', () => {
  let component: HealthConsultationAddComponent;
  let fixture: ComponentFixture<HealthConsultationAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthConsultationAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthConsultationAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
