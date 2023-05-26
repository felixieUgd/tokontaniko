import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthDetailDocumentComponent } from './health-detail-document.component';

describe('HealthDetailDocumentComponent', () => {
  let component: HealthDetailDocumentComponent;
  let fixture: ComponentFixture<HealthDetailDocumentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthDetailDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthDetailDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
