import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FileUploader } from 'ng2-file-upload';
import { ContactService } from 'src/app/contact/contact.service';

import Contact from 'src/app/models/contact';

import { NotificationService } from 'src/app/_services/notification.service';
import { SessionService } from 'src/app/_services/session.service';
import { UtilityService } from 'src/app/_services/utility.service';

import * as moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContactPreviewComponent } from 'src/app/contact/contact-preview/contact-preview.component';
import {Subscription} from 'rxjs';
@Component({
  selector: 'app-health-detail',
  templateUrl: './health-detail.component.html',
  styleUrls: ['./health-detail.component.css']
})
export class HealthDetailComponent implements OnInit, OnDestroy {
  uploader: FileUploader;
  contact?: Contact;

  subscription: Subscription;
  
  constructor(
    private contactService: ContactService,
    private notification: NotificationService,
    private sessionService: SessionService,
    private utilityService: UtilityService,
    private modalService: NgbModal,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.subscription = this.route.paramMap.subscribe(param => {
      const idParam = param.get('id');
      if (idParam && !isNaN(+idParam)) {
        this.loadContact(+idParam);
      }
      else {
        this.notification.error(null, 'PERSON_NOT_FOUND');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  getDiff(date: any) {
    if (!date) {
      return null;
    }

    return moment().diff(moment(date), 'years');
  }

  loadContact(id: number) {
    this.contactService.get(id).toPromise().then(contact => {
      this.contact = contact;
    }).catch(err => this.notification.error(null, err.error));
  }

  preview(idPhoto, type?: string) {
    if (idPhoto) {
      const modalRef = this.modalService.open(ContactPreviewComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.idPhoto = idPhoto;
      modalRef.componentInstance.type = type ? type : 'documents';
    }
    else {
      this.notification.warning(null, 'FILE_NOT_FOUND');
    }
  }

  uploadPhoto() {
    if (this.contact) {
      this.uploader = new FileUploader({
        url: this.utilityService.getUploadUrl(this.contact.id, 'CONTACT'),
        method: 'POST',
        headers: [
          {name: 'X-Access-Token', value: this.sessionService.getToken()}
        ],
        autoUpload: true
      });

      this.uploader.onAfterAddingFile = (file) => {
        file.withCredentials = false;
      };
      this.uploader.onSuccessItem = (file, response, status, header) => {
        this.loadContact(this.contact.id);
        this.notification.success(null, 'UPLOAD_SUCCESS');
      };
    }
    else {
      this.notification.error(null, 'PERSON_NOT_FOUND');
    }
  }

}
