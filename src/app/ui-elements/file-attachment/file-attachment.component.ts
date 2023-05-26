import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FileUploader } from 'ng2-file-upload';
import { SessionService } from 'src/app/_services/session.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GalleryModalComponent } from '../modals/gallery-modal/gallery-modal.component';

import { ConfirmModalComponent } from '../modals/confirm-modal/confirm-modal.component';
import {UtilityService} from 'src/app/_services/utility.service';
import { Confirmable } from 'src/app/shared/decorators/confirmable.decorator';
import {AppService} from 'src/app/app.service';
import {EXTENSIONS_BY_MIME} from 'src/app/shared/config/extension.config';

import * as moment from 'moment';

@Component({
  selector: 'app-file-attachment',
  templateUrl: './file-attachment.component.html',
  styleUrls: ['./file-attachment.component.css']
})
export class FileAttachmentComponent implements OnInit {
  @Input() id: number;
  @Input() route: string;
  @Input() type: string;
  @Input() canUpload: boolean = true;
  @Input() canDelete: boolean = true;
  @Input() attachments: any[];

  @Input() submittedForm: boolean = false;
  @Input() suffixName: string;

  @Output() onSuccess = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  doc_name: string;
  uploader: FileUploader;

  uniqueId: string;

  modalRef: NgbModalRef;

  submitted = false;
  isLoading = false;

  constructor(
    private appService: AppService,
    private sessionService: SessionService,
    private notification: NotificationService,
    private modalService: NgbModal,
    private utilityService: UtilityService
  ) {
    this.uniqueId = this.uuidv4();
  }

  ngOnInit() {
  }

  isImage(doc: any) {
    if (!doc || !doc.doc_mime) {
      return true;
    }

    return doc.doc_mime.startsWith('image/');
  }

  openConfirm(callback: Function, title?: string, content?: string){
    this.modalRef = this.modalService.open(ConfirmModalComponent);
    this.modalRef.componentInstance.title = title;
    this.modalRef.componentInstance.text = content;
    this.modalRef.result
      .then(val => {
        if(val){
          callback();
        }else{
          this.notification.warning(null, 'OPERATION_CANCELED');
        }
      })
      .catch(err => {
        this.notification.warning(null, 'OPERATION_CANCELED');
      })
  }

  @Confirmable({ html: 'Êtes-vous sûr de vouloir supprimer ce document?' })
  deleteAttachment(idPhoto: string){
    this.onDelete.next(idPhoto);
  }

  download(doc: any) {
    this.utilityService.downloadFile(doc, 'documents', this.suffixName).toPromise().then(res => {
      this.notification.info(null, 'DOWNLOAD_STARTED');
    }).catch(err => {
      this.notification.error(null, err.error);
    });
  }

  formatDocName(doc: any, withSuffix?: boolean) {
    if (!doc) return null;
    let name = doc.doc_name || moment(doc.created).format('YYYY-MM-DDTHH:mm:ss');

    if (withSuffix && this.suffixName) {
      name += '_' + this.suffixName;
    }

    const extension = this.getExtension(doc);
    if (extension) {
      name += '.' + extension;
    }

    return name;
  }

  previewDoc(idPhoto: string) {
    if (idPhoto) {
      const modalRef = this.modalService.open(GalleryModalComponent, {size: 'lg', windowClass: 'img-preview'});
      modalRef.componentInstance.currentId = idPhoto;
      modalRef.componentInstance.suffixName = this.suffixName;
      modalRef.componentInstance.items = this.attachments.reduce((res, item) => {
        if (this.isImage(item)) {
          res.push(item);
        }

        return res;
      }, []);

      if (this.type) {
        modalRef.componentInstance.type = this.type;
      }
    }
    else {
      this.notification.warning(null, 'FILE_NOT_FOUND');
    }
  }

  uploadDocument(event: any) {
    if(this.isLoading){
      event.preventDefault();
      return;
    }

    this.submitted = true;

    if (this.doc_name) {
      if(!this.id) {
        event.preventDefault();
        console.error('ID not defined');
        return;
      }

      if(!this.route) {
        event.preventDefault();
        console.error('Attachment route not defined');
        return;
      }

      const url = this.utilityService.getUploadUrl(this.id, 'ATTACHMENT', this.route);
      this.uploader = new FileUploader({
        url,
        method: 'POST',
        headers: [
          {name: 'X-Access-Token', value: this.sessionService.getToken()}
        ],
        additionalParameter: {
          doc_name: this.doc_name
        },
        autoUpload: true
      });

      this.uploader.onAfterAddingFile = (file) => {
        file.withCredentials = false;
      };

      this.uploader.onBeforeUploadItem = (file) => {
        this.isLoading = true;
      }

      this.uploader.onSuccessItem = (file, response, status, header) => {
        const result = JSON.parse(response);
        this.onSuccess.next(result);
        this.notification.success(null, 'UPLOAD_SUCCESS');
      };

      this.uploader.onErrorItem = (file, response) => {
        let err: any;
        try {
          err = JSON.parse(response);
        }
        catch(e) {
          err = {error: 'UPLOAD_FAILED'};
        }

        this.notification.error(null, err.error);
      }

      this.uploader.onCompleteItem = () => {
        this.doc_name = "";
        this.submitted = false;
        this.isLoading = false;
      }
    }
    else {
      event.preventDefault();
      this.notification.error(null, 'DOCUMENT_NAME_INVALID');
    }
  }

  private getExtension(doc: any) {
    if (!doc || !doc.doc_mime) {
      return null;
    }

    return EXTENSIONS_BY_MIME[doc.doc_mime];
  }

  private uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

}
