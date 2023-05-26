import {Directive, ElementRef, Input, OnInit, OnChanges, EventEmitter, Output, SimpleChanges, OnDestroy} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from 'src/environments/environment';
import {AppService} from 'src/app/app.service';

import * as FileType from 'file-type';



@Directive({
  selector: '[appImagesrc]'
})
export class ImagesrcDirective implements OnInit, OnChanges, OnDestroy {
  @Input() itemRef: any;
  @Input() docId: number;
  @Input() docType: string;

  @Output() callback = new EventEmitter<any>();

  constructor(private el: ElementRef,
              private http: HttpClient
  ) {
    this.setDefaultImage();
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadPhoto(changes['docId'].currentValue);
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('load', this.onLoad);
    this.el.nativeElement.removeEventListener('error', this.onError);
  }

  setDefaultImage() {
    this.el.nativeElement.src = AppService.DEFAULT_IMAGE;
  }

  private loadPhoto(value): void {
    const headers = new HttpHeaders().set('accept', 'image / webp, image/*,*/ *; q = 0.8');
    const _url = [AppService.API, 'static', this.docType, this.docId].join('/');

    this.http.get(_url, {headers, responseType: 'arraybuffer'})
      .toPromise()
      .then((res) => {
        let blob = new Blob(
          [res]
        );

        let type = null;

        if (!this.itemRef || !this.itemRef.doc_mime) {
          type = FileType(new Uint8Array(res)).mime;
        }
        else {
          type = this.itemRef.doc_mime;
        }

        blob = blob.slice(0, blob.size, type);

        //if loading status is required
        if (this.callback) {
          const image = this.el.nativeElement as HTMLImageElement;
          image.addEventListener('load', this.onLoad);
          image.addEventListener('error', this.onError);
        }

        const url = URL.createObjectURL(blob);

        this.el.nativeElement.src = url;

        if (this.itemRef) {
          this.itemRef.url = url;
        }
      })
      .catch(err => {
        this.setDefaultImage();

        if(this.callback){
          this.callback.next({id: this.docId, isSuccess: false, item: this.itemRef});
        }
      })
  }

  onLoad = () => {
    this.callback.next({id: this.docId, isSuccess: true, item: this.itemRef});
  }

  onError = () => {
    this.setDefaultImage();
    this.callback.next({id: this.docId, isSuccess: false, item: this.itemRef});
  }
}
