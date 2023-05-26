import { Component, OnDestroy, OnInit } from '@angular/core';
import {Subscription} from 'rxjs';
import {SidePanelNoteService} from './side-panel-note.service';

import * as moment from 'moment';
import {AppService} from 'src/app/app.service';

@Component({
  selector: 'app-side-panel-note',
  templateUrl: './side-panel-note.component.html',
  styleUrls: ['./side-panel-note.component.css']
})
export class SidePanelNoteComponent implements OnInit, OnDestroy {

  config: any;
  note: string;
  isOpen: boolean;

  date = new Date();
  maxDate = this.appService.getMaxDate();

  subscription = new Subscription();

  constructor(
    private appService: AppService,
    private sidePanelNoteService: SidePanelNoteService
  ) { }

  get key() {
    return moment(this.date).format('YYYY-MM-DD')
  }

  ngOnInit() {
    this.initEditor();

    this.subscription.add(
      this.sidePanelNoteService.sidePanel.subscribe(value => {
        this.isOpen = value;
        if (this.isOpen) {
          this.getNoteByDate();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  close() {
    this.sidePanelNoteService.sidePanel.next(false);
  }

  getNoteByDate() {
    this.note = this.sidePanelNoteService.getNote(this.key);
  }

  saveNote() {
    this.sidePanelNoteService.setNote(this.note || '', this.key);
  }

  private initEditor() {
    this.config = {
      placeholder: 'Écrivez quelque chose...',
      tabsize: 2,
      height: '640px',
      toolbar: [
        ['font', ['bold', 'underline', 'strikethrough']],
        ['fontsize', ['fontsize']],
        ['para', ['ul', 'ol']]
      ],
      disableResizeEditor: true
    };
  }

}
