import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppendItemModalComponent } from './append-item-modal.component';

describe('AppendItemModalComponent', () => {
  let component: AppendItemModalComponent;
  let fixture: ComponentFixture<AppendItemModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppendItemModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppendItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
