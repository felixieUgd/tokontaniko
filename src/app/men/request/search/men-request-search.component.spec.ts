import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenRequestSearchComponent } from './men-request-search.component';

describe('MenRequestSearchComponent', () => {
  let component: MenRequestSearchComponent;
  let fixture: ComponentFixture<MenRequestSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MenRequestSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenRequestSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
