import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateLockScreenComponent } from './update-lock-screen.component';

describe('UpdateLockScreenComponent', () => {
  let component: UpdateLockScreenComponent;
  let fixture: ComponentFixture<UpdateLockScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateLockScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateLockScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
