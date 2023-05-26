import {Component, OnInit} from '@angular/core';
import {FormGroup, Validators, FormBuilder} from '@angular/forms';
import {Router} from '@angular/router';

import {HrPositionService} from 'src/app/hr/position/hr-position.service';
import {NotificationService} from 'src/app/_services/notification.service';

import Position from 'src/app/models/position';
import { PrintService } from 'src/app/_services/print.service';

@Component({
  selector: 'app-hr-position',
  templateUrl: './hr-position.component.html',
  styleUrls: ['./hr-position.component.css']
})
export class HrPositionComponent implements OnInit {
  addForm: FormGroup;
  positions: Position[];
  sidePanelOpen;
  submitted;

  constructor(private formBuilder: FormBuilder,
    public positionService: HrPositionService,
    private printService: PrintService,
    private notification: NotificationService,
    private router: Router) {
  }

  ngOnInit() {
    this.sidePanelOpen = false;

    this.initForm();
    this.getPositions();
  }

  printPay() {
    this.printService.pay();
  }

  reset() {
    this.sidePanelOpen = false;
    this.addForm.reset();
  }

  save() {
    this.submitted = true;

    if (this.addForm.valid) {
      const body = new Position(this.addForm.value);

      this.positionService.create(body)
        .toPromise()
        .then(res => {
          this.reset();
          this.router.navigate(['/hr/position/detail', res.id]);
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID')
    }
  }

  private getPositions() {
    this.positionService.list()
      .then(res => this.positions = res)
      .catch(err => this.notification.error(this, err.error));
  }

  private initForm() {
    this.submitted = false;

    this.addForm = this.formBuilder.group({
      title: [null, Validators.required],
      description: [null, Validators.required],
      paid_leaves: [null, Validators.required]
    });
  }
}
