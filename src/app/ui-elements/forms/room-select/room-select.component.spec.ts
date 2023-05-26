import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomSelectComponent } from './room-select.component';

describe('RoomSelectComponent', () => {
  let component: RoomSelectComponent;
  let fixture: ComponentFixture<RoomSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
