import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalAccordionComponent } from './medical-accordion.component';

describe('MedicalAccordionComponent', () => {
  let component: MedicalAccordionComponent;
  let fixture: ComponentFixture<MedicalAccordionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MedicalAccordionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicalAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
