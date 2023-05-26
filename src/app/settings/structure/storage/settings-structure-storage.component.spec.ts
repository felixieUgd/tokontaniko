import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsStructureStorageComponent } from './settings-structure-storage.component';

describe('SettingsStructureStorageComponent', () => {
  let component: SettingsStructureStorageComponent;
  let fixture: ComponentFixture<SettingsStructureStorageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsStructureStorageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsStructureStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
