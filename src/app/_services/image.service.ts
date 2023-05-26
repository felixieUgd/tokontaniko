import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ContactPreviewComponent} from '../contact/contact-preview/contact-preview.component';
import {NotificationService} from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  public static logo: string;
  public static signature: string;
  //  Men
  public static education: string;
  public static onapascoma: string;
  public static republique: string;
  //

  constructor(
    private http: HttpClient,
    private ngbModal: NgbModal,
    private notification: NotificationService
  ) { }

  localeImageToBase64(localPath: string, docname) {
    const headers = new HttpHeaders().set(
      'accept',
      'image / webp, image/*,*/ *; q = 0.8'
    );

    return this.http
      .get(localPath, {headers, responseType: 'arraybuffer'})
      .toPromise()
      .then(res => {
        const blob = new Blob([res]);
        const reader = new FileReader();

        reader.readAsDataURL(blob);
        reader.onload = function () {
          ImageService[docname] = reader.result;
        };
      })
      .catch(err => this.notification.error(null, err.error));
  }

  preview(idPhoto: string) {
    if (idPhoto) {
      const modalRef = this.ngbModal.open(ContactPreviewComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.idPhoto = idPhoto;
    }
    else this.notification.warning(null, 'FILE_NOT_FOUND');
  }
}
