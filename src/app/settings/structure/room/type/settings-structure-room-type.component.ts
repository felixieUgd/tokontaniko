import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {RoomService} from 'src/app/_services/room.service';
import RoomType from 'src/app/models/room-type';
import {NotificationService} from 'src/app/_services/notification.service';

@Component({
  selector: 'app-settings-structure-room-type',
  templateUrl: './settings-structure-room-type.component.html',
  styleUrls: ['./settings-structure-room-type.component.css']
})
export class SettingsStructureRoomTypeComponent implements OnInit {

  typeForm: FormGroup;
  types: RoomType[];
  Type: RoomType;

  sidePanelOpen: boolean;
  submitted: boolean;

  constructor(private formBuilder: FormBuilder,
    private roomService: RoomService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    this.initForm();
    this.fetchRoomTypes();
  }

  close() {
    this.Type = null;
    this.sidePanelOpen = false;
    this.submitted = false;
    this.typeForm.reset({
      enabled: true
    });
  }

  edit(id) {
    this.sidePanelOpen = true;
    this.typeForm.reset();

    this.roomService.getType(id)
      .then(res => {
        this.Type = res;
        this.typeForm.patchValue(res);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  open() {
    this.sidePanelOpen = true;
    this.Type = null;
  }

  save() {
    this.submitted = true;

    if (this.typeForm.valid) {
      if (this.Type) {
        this.update();
      }
      else {
        this.create();
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private create() {
    const type = new RoomType(this.typeForm.value);

    this.roomService.createType(type)
      .toPromise()
      .then(res => {
        this.ngOnInit();
        this.notification.success(null, 'SAVE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

  private fetchRoomTypes() {
    this.roomService.listType()
      .toPromise()
      .then(res => this.types = res)
      .catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.sidePanelOpen = false;
    this.submitted = false;
    this.typeForm = this.formBuilder.group({
      code: [null, Validators.required],
      color: [null, Validators.required],
      description: [null, Validators.required],
      enabled: true,
      name: ['', Validators.required],
    });
  }

  private update() {
    const type = new RoomType(Object.assign({}, this.typeForm.value, {
      id: this.Type.id
    }));

    this.roomService.updateType(type)
      .toPromise()
      .then(res => {
        this.ngOnInit();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => {
        this.notification.error(null, err.error);
      });
  }

}
