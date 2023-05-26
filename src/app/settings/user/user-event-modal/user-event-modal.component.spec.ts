import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEventModalComponent } from './user-event-modal.component';

describe('UserEventModalComponent', () => {
  let component: UserEventModalComponent;
  let fixture: ComponentFixture<UserEventModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserEventModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserEventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
