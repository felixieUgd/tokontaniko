import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsStructureRoomComponent } from './settings-structure-room.component';

describe('SettingsStructureRoomComponent', () => {
  let component: SettingsStructureRoomComponent;
  let fixture: ComponentFixture<SettingsStructureRoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsStructureRoomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsStructureRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
