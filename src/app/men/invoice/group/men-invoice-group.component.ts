import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import * as moment from 'moment';
import {SmartTable, of} from 'smart-table-ng';
import {AppService} from 'src/app/app.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import InvoiceGroup from 'src/app/models/invoice-group';
import {ExportService} from 'src/app/_services/export.service';
import {SessionService} from 'src/app/_services/session.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';
import {FilterOperator} from 'smart-table-filter';
import server from 'smart-table-server';
import {MenService} from '../../men.service';

const TS_KEY = 'TS_MEN_INVOICE_GROUP';

@Component({
  selector: 'app-men-invoice-group',
  templateUrl: './men-invoice-group.component.html',
  styleUrls: ['../../../../assets/scss/plugins/_datepicker.scss'],
  providers: [{
    provide: SmartTable,
    useFactory: (invoiceService: InvoiceService, menService: MenService) => of(
      [],
      menService.getInvoiceGroupConfig(TS_KEY),
      server({
        query: (tableState) => invoiceService.paginateGroup(tableState, TS_KEY)
      })
    ),
    deps: [InvoiceService, MenService]
  }]
})
export class MenInvoiceGroupComponent implements OnInit {

  dateForm: FormGroup;

  dateFormSubmitted = false;

  constructor(public _table: SmartTable<any>,
    public appService: AppService,
    private exportService: ExportService,
    private invoiceService: InvoiceService,
    private formBuilder: FormBuilder,
    private sessionService: SessionService,
    public smartTableService: SmartTableService) {
  }

  ngOnInit() {
    this.initForm();
  }

  export(table: InvoiceGroup[]) {
    const data = [];

    table.forEach(group => {
      const invoice_size = group.Invoices.length;
      const montant = invoice_size > 0 ? group.meta.total : 0;

      data.push({
        numero: group.id,
        contact: group.Contact.name,
        date: moment(group.due_at).format('DD/MM/YYYY'),
        nombre: group.Invoices.length,
        montant: montant,
        creation: moment(group.created_at).format('DD/MM/YYYY')
      });
    });

    this.exportService.exportToExcel(data, 'Etat_de_versement');
  }

  filterResult() {
    this.dateFormSubmitted = true;

    if (this.dateForm.valid) {
      const params = {
        start: moment(this.dateForm.controls.start.value).startOf('day').format(),
        end: moment(this.dateForm.controls.end.value).endOf('day').format()
      };

      this._table.filter({
        created_at: [
          {
            value: params.start,
            operator: FilterOperator.GREATER_THAN_OR_EQUAL,
            type: 'string'
          },
          {
            value: params.end,
            operator: FilterOperator.LOWER_THAN_OR_EQUAL,
            type: 'string'
          }
        ]
      });
    }
  }

  getInvoiceGroupAmount(invoiceGroup: InvoiceGroup) {
    let amount = 0;

    invoiceGroup.Invoices.forEach(invoice => {
      amount += this.invoiceService.getPaymentDue(invoice.InvoiceItems);
    });

    return amount;
  }

  resetForm() {
    this.dateFormSubmitted = false;
    this.dateForm.reset({
      start: moment().startOf('year').toDate(),
      end: moment().endOf('day').toDate()
    });

    this.filterResult();
  }

  private initForm() {
    this.dateForm = this.formBuilder.group({
      start: [moment().startOf('year').toDate(), Validators.required],
      end: [moment().endOf('day').toDate(), Validators.required]
    });

    this.sessionService.setDateForm(this.dateForm, TS_KEY, 'created_at');
  }

}
