import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelTransferComponent } from './side-panel-transfer.component';

describe('SidePanelTransferComponent', () => {
  let component: SidePanelTransferComponent;
  let fixture: ComponentFixture<SidePanelTransferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidePanelTransferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidePanelTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
