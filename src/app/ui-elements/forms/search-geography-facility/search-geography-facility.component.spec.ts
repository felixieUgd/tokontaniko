import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchGeographyFacilityComponent } from './search-geography-facility.component';

describe('SearchGeographyFacilityComponent', () => {
  let component: SearchGeographyFacilityComponent;
  let fixture: ComponentFixture<SearchGeographyFacilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchGeographyFacilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchGeographyFacilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
