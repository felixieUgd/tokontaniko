import {Component, OnInit, ViewChild} from '@angular/core';
import {ImageCroppedEvent, ImageCropperComponent} from 'ngx-image-cropper';
import {NotificationService} from '../../_services/notification.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  imageChangedEvent: any = '';
  croppedImage: any = '';
  loaded = false;
  ratio = [1/1, 3/2, 4/3, 16/9];
  selected_ratio = 1/1;
  width = 400;

  @ViewChild(ImageCropperComponent) imageCropper: ImageCropperComponent;

  constructor(private notification: NotificationService) {
  }

  ngOnInit() {
  }

  crop() {
    let cropped = this.imageCropper.crop();
  }

  fileChangeEvent(event: any): void {
    this.croppedImage = '';
    this.loaded = false;

    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }

  imageLoaded() {
    this.loaded = true;
  }

  loadImageFailed() {
    this.notification.error(null, 'LOAD_IMAGE_FAILED')
  }
}
