import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthAddComponent } from './health-add.component';

describe('HealthAddComponent', () => {
  let component: HealthAddComponent;
  let fixture: ComponentFixture<HealthAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
