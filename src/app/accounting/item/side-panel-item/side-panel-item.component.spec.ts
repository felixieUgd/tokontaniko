import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelItemComponent } from './side-panel-item.component';

describe('SidePanelItemComponent', () => {
  let component: SidePanelItemComponent;
  let fixture: ComponentFixture<SidePanelItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidePanelItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidePanelItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
