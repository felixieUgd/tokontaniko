import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthDetailComponent } from './health-detail.component';

describe('HealthDetailComponent', () => {
  let component: HealthDetailComponent;
  let fixture: ComponentFixture<HealthDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
