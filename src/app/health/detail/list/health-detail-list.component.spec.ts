import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthDetailListComponent } from './health-detail-list.component';

describe('HealthDetailListComponent', () => {
  let component: HealthDetailListComponent;
  let fixture: ComponentFixture<HealthDetailListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthDetailListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthDetailListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
