import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationService } from 'src/app/_services/authentication.service';

@Component({
  selector: 'app-update-lock-screen',
  templateUrl: './update-lock-screen.component.html',
  styleUrls: ['./update-lock-screen.component.css']
})
export class UpdateLockScreenComponent implements OnInit {
  @Input() message: string;

  constructor(
    public elementRef: ElementRef,
    private authService: AuthenticationService,
    private activeModal: NgbActiveModal
  ) { }

  ngOnInit() {
  }

  logout() {
    this.authService.logout();
    this.activeModal.dismiss();
  }
}
