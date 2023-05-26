import { Component, OnInit, Input, AfterContentInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/_services/notification.service';
import {UtilityService} from 'src/app/_services/utility.service';

import * as moment from 'moment';
import {EXTENSIONS_BY_MIME} from 'src/app/shared/config/extension.config';
@Component({
  selector: 'app-gallery-modal',
  templateUrl: './gallery-modal.component.html',
  styleUrls: ['./gallery-modal.component.css']
})
export class GalleryModalComponent implements OnInit, AfterContentInit {
  @Input() currentId: string;
  @Input() suffixName: string;
  @Input() items = [];
  @Input() type = 'documents';

  displayedItems = [];

  loadingMap = new Map<string, boolean>();
  isInitialized = false;

  constructor(public activeModal: NgbActiveModal,
              private utilityService: UtilityService,
              private notification: NotificationService
  ) { 
    
  }

  ngOnInit() {
  }

  ngAfterContentInit(){
    if (this.isInitialized) {
      return;
    }

    this.displayedItems = this.items;

    this.displayedItems.forEach(img => {
      this.loadingMap.set(img.doc_id, true);
    });
    this.isInitialized = true;
  }

  download(doc: any) {
    if (doc && doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      let name = doc.doc_name || moment(doc.created).format('YYYY-MM-DDTHH:mm:ss');

      if (this.suffixName) {
        name += '_' + this.suffixName;
      }

      if (doc.doc_mime) {
        name += '.' + (EXTENSIONS_BY_MIME[doc.doc_mime] || 'jpg')
      }

      link.setAttribute('download', name);
      link.setAttribute('target', 'blank');
      link.click();
      link.remove();
    }
    else {
      this.notification.error(null, 'FILE_NOT_FOUND');
    }
  }

  isLoading() {
    return this.loadingMap.size > 0;
  }

  setLoading(event: any) {
    if(this.loadingMap.has(event.id)){
      this.loadingMap.delete(event.id);
      if(!event.isSuccess && event.item){
        event.item.isNotSupported = true;
      }
    }
  }

  zoomImage(el: HTMLElement){
    if (el) {
      const src = el.getAttribute('src');
      if (src) {
        window.open(src);
      }
      else {
        this.notification.error(null, 'FILE_NOT_FOUND');
      }
    }
  }

  dismiss() {
    this.activeModal.dismiss();
  }

}
