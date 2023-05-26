import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HealthDetailDocumentComponent } from 'src/app/health/detail/document/health-detail-document.component';
import { MaintenanceService } from 'src/app/maintenance/maintenance.service';
import Request, { RequestType } from 'src/app/models/request';

@Component({
  selector: 'app-medical-accordion',
  templateUrl: './medical-accordion.component.html',
  styleUrls: ['./medical-accordion.component.css']
})
export class MedicalAccordionComponent implements OnInit {
  @Input() requests: Request[];
  @Input() type?: RequestType;

  constructor(
    public maintenanceService: MaintenanceService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
  }

  openDetailModal(id: number) {
    const modalRef = this.modalService.open(HealthDetailDocumentComponent, {
      size: 'lg',
      windowClass: 'full-modal'
    });

    modalRef.componentInstance.documentId = id;
    modalRef.componentInstance.isModal = true;
  }
}
