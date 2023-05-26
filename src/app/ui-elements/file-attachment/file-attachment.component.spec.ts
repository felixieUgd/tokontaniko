import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileAttachmentComponent } from './file-attachment.component';

describe('FileAttachmentComponent', () => {
  let component: FileAttachmentComponent;
  let fixture: ComponentFixture<FileAttachmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileAttachmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
