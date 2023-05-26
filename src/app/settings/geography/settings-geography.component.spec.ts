import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsGeographyComponent } from './settings-geography.component';

describe('SettingsGeographyComponent', () => {
  let component: SettingsGeographyComponent;
  let fixture: ComponentFixture<SettingsGeographyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsGeographyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsGeographyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
