import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsStructureRoomTypeComponent } from './settings-structure-room-type.component';

describe('SettingsStructureRoomTypeComponent', () => {
  let component: SettingsStructureRoomTypeComponent;
  let fixture: ComponentFixture<SettingsStructureRoomTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsStructureRoomTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsStructureRoomTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
