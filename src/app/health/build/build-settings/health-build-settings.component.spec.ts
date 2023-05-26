import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthBuildSettingsComponent } from './health-build-settings.component';

describe('HealthBuildSettingsComponent', () => {
  let component: HealthBuildSettingsComponent;
  let fixture: ComponentFixture<HealthBuildSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthBuildSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthBuildSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
