import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {DatePipe, formatCurrency} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';

import * as moment from 'moment';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import _sumBy from 'lodash.sumby';
import _filter from 'lodash.filter';
import _map from 'lodash.map';
import _groupBy from 'lodash.groupby';
import _cloneDeep from 'lodash.clonedeep';
import * as pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
import {MaskPipe} from 'ngx-mask';

import Bill, { BillItem } from 'src/app/models/bill';
import Contact from '../models/contact';
import Currency from 'src/app/models/currency';
import Invoice, {InvoiceItem} from 'src/app/models/invoice';
import InvoiceGroup from '../models/invoice-group';
import Request from '../models/request';
import User from '../models/user';

import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {NotificationService} from './notification.service';
import {SessionService} from './session.service';
import {TranslateService} from '@ngx-translate/core';
import {UtilityService} from './utility.service';
import Revenue from '../models/revenue';

import {NumberToLetter} from 'convertir-nombre-lettre';
import {SettingsCompanyService} from '../settings/company/settings-company.service';
import {AccountingService} from './accounting.service';
import HealthDiagnosticCodeNode from '../models/health-diagnostic-code-node';
import {HealthService} from '../health/health.service';
import {ImageService} from './image.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import Room from '../models/room';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
const DEFAULT_CURRENCY = 'MGA';

@Injectable({
  providedIn: 'root'
})
export class PrintService implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];

  constructor(
    public accountingService: AccountingService,
    private datePipe: DatePipe,
    private http: HttpClient,
    private invoiceService: InvoiceService,
    private mask: MaskPipe,
    private maintenanceService: MaintenanceService,
    private notification: NotificationService,
    private translateService: TranslateService,
    private settingsCompanyService: SettingsCompanyService,
    private sessionService: SessionService,
    private translate: TranslateService,
    private healthService: HealthService,
    private utilityService: UtilityService
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if (this.subscriptions.length > 0) {
      _forEach(this.subscriptions, (sub) => sub.unsubscribe());
    }
  }

  company: any = () => {
    return JSON.parse(sessionStorage.getItem(SettingsCompanyService.KEY));
  };

  actOfAccession(invoice: Invoice) {
    if (invoice.status === 'PAID') {
      const school_year = invoice.meta && invoice.meta.school_year ? invoice.meta.school_year : null;
      const totalPayment = this.invoiceService.getTotalPayment(invoice);
      const revenue: Revenue = invoice.Revenues[0];
      const numberOfItem = invoice.InvoiceItems[0].quantity || invoice.meta.length;
      const company = this.sessionService.getActiveCompany();
      const actNumber = invoice.Facility.Geography.Parent.id + '-' + invoice.id;

      let lastYear = '';
      if (school_year) {
        const split = school_year.split('-');
        if (split.length > 1) {
          lastYear = split[split.length - 1].trim();
        }
      }

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 70],
        watermark: {
          text: 'PASCOMA',
          angle: 60,
          fontSize: 35,
          opacity: 0.04
        },
        footer: {
          columns: [
            {
              width: '*',
              alignment: 'center',
              text: 'Ny fiantohana dia manakery manomboka amin\'ny daty nandoavana ny latsakemboka ary miafara amin\'ny andro\nfaran\'ny taom-pianaran\'ny sekoly izay voalaza etsy ambany',
              italics: true,
              fontSize: 7,
              margin: [70, 30, 10, 0]
            },
            {
              width: 'auto',
              alignment: 'center',
              stack: [
                {
                  qr: actNumber.toString(),
                  fit: 45,
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                {
                  text: actNumber,
                  alignment: 'center',
                  fontSize: 7
                }
              ],
              margin: [10, 10, 25, 10]
            }
          ]
        },
        content: [
          {
            width: 200,
            image: 'republique',
            alignment: 'center'
          },
          {
            layout: 'noBorders',
            table: {
              widths: [150, '*', 170],
              body: [
                [
                  {
                    width: 90,
                    image: 'education',
                    alignment: 'center'
                  },
                  '',
                  {
                    width: 100,
                    image: 'onapascoma',
                    alignment: 'center'
                  }
                ],
                [
                  {
                    text: 'MINISTERE DE L\'EDUCATION\n NATIONALE',
                    fontSize: 9,
                    alignment: 'center'
                  },
                  '',
                  {
                    text: 'OFFICE NATIONALE DE LA PASCOMA \n' + (company.phone || ''),
                    fontSize: 9,
                    alignment: 'center'
                  }
                ]
              ]
            }
          },
          {
            alignment: 'center',
            text: [
              {
                text: 'ACTE D\'ADHESION\n',
                fontSize: 13,
                bold: true
              },
              {
                text: invoice.notes? (invoice.notes + '\n'): '',
                fontSize: 12,
                bold: true
              },
              {
                text: 'Fanamarinana fisoratana Anarana',
                bold: true
              }
            ]
          },
          {
            text: '',
            style: 'separator-sm'
          },
          {
            margin: [30, 0],
            text: [
              'Ny ONaPASCOMA dia manamarina etoana fa ny sekoly izay voalaza etsy ambany dia\n',
              'nahaloa ara-dalàna my latsakemboka na "assurance scolaire", taom-pianarana ' + (school_year || ''),
              {
                text: '\n\nNATOKANA HILAZANA MOMBA NY SEKOLY\n\n',
                bold: true
              }
            ]
          },
          {
            margin: [30, 0],
            text: [
              {text: 'Anaran\'ny Sekoly :', decoration: 'underline', bold: true, style: 'p'},
              {text: ' ' + invoice.Facility.name + '\n', style: 'p'},
              {text: 'DREN :', decoration: 'underline', bold: true, style: 'p'},
              {text: ' ' + invoice.Facility.Geography.Parent.Parent.region + '\n', style: 'p'},
              {text: 'CISCO :', decoration: 'underline', bold: true, style: 'p'},
              {text: ' ' + invoice.Facility.Geography.Parent.district + '\n', style: 'p'},
              {text: 'ZAP :', decoration: 'underline', bold: true},
              {text: ' ' + invoice.Facility.Geography.commune + '\n', style: 'p'},
              {text: 'Code Etablissement :', decoration: 'underline', bold: true},
              {text: ' ' + invoice.Facility.code + '\n', style: 'p'},
              {text: 'Vola naloha :', decoration: 'underline', bold: true},
              {text: ' ' + this.formatCurrency(totalPayment, 'Ar') + '\n', style: 'p'},
              {text: 'Daty nandraisan\'ny ONaPASCOMA foibe ny vola :', decoration: 'underline', bold: true},
              {text: ' ' + moment(revenue.paid_at).format('DD MMM YYYY') + '\n', style: 'p'},
              {text: 'Référence de pièces de versement :', decoration: 'underline', bold: true},
              {text: ' ' + revenue.id + '\n', style: 'p'},
              {text: 'Isan\'ny Mpianatra iantohana :', decoration: 'underline', bold: true},
              {text: ' ' + numberOfItem + '\n', style: 'p'},
              {text: 'Daty fiafaran\'ny Taom-pianaran\'ny sekoly :', decoration: 'underline', bold: true},
              {text: ' ' + (lastYear), style: 'p'}
            ]
          },
          {
            text: '',
            style: 'separator-xs'
          },
          {
            margin: [30, 0],
            text: [
              {text: 'N° acte d\'adhésion :', decoration: 'underline', bold: true},
              {text: ' ' + actNumber}
            ]
          },
          {
            text: '',
            style: 'separator-sm'
          },
          {
            margin: [30, 0],
            columnGap: 10,
            columns: [
              {
                width: 170,
                alignment: 'center',
                bold: true,
                text: [
                  {text: 'Chef de service Assurance\n'},
                  {text: 'ONaPASCOMA\n\n\n\n\n\n\n'},
                  {text: 'SOLOMALALA Lilas Aimée'}
                ]
              },
              {
                width: '*',
                text: ''
              },
              {
                width: 190,
                alignment: 'center',
                bold: true,
                text: [
                  {text: 'Chef de division Assurance scolaire\n'},
                  {text: 'ONaPASCOMA\n\n\n\n\n\n\n'},
                  {text: 'RAOBANITRA Misa Maholy'}
                ]
              }
            ]
          }
        ],
        defaultStyle: {
          fontSize: 11
        },
        styles: {
          'separator-xs': {
            margin: [0, 10]
          },
          'separator-sm': {
            margin: [0, 20]
          },
          p: {
            margin: [0, 3]
          }
        },
        images: {
          education: ImageService.education,
          republique: ImageService.republique,
          onapascoma: ImageService.onapascoma
        }
      };

      pdfMake.createPdf(docDefinition).print();
    }
    else {
      this.notification.error(null, 'INVOICE_NOT_PAID');
    }
  }

  badge(user: User, filename) {
    const company = this.company().name;
    const id = user.code;
    const logo = ImageService.logo;
    const name = user.name;
    const profile = user['photo64'];
    const title = user.Profile ? user.Profile.Position.title.toUpperCase() : ' ';

    this.http.get('assets/images/background/' + filename, {responseType: 'blob'})
      .toPromise()
      .then(res => {
        const height = 295.056;
        const reader = new FileReader();
        const width = 198.4;

        reader.readAsDataURL(res);
        reader.onload = function () {
          const background = reader.result;
          const docDefinition = {
            pageSize: {
              width,
              height
            },
            pageMargins: [0, 20, 0, 0],
            background: {
              image: 'background',
              width,
              height
            },
            watermark: {
              text: company + ' ' + company,
              angle: 60,
              fontSize: 35,
              opacity: 0.04
            },
            content: [
              {
                layout: 'noBorders',
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        alignment: 'center',
                        image: 'logo',
                        height: 40,
                        width: 65,
                        margin: [0, 0, 0, 15]
                      }
                    ],
                    [
                      {
                        alignment: 'center',
                        image: 'profile',
                        fit: [80, 80],
                        margin: [0, 0, 0, 15]
                      }
                    ],
                    [
                      {
                        text: name,
                        alignment: 'center',
                        bold: true,
                        color: '#FFFFFF',
                        fontSize: 13,
                        margin: [0, 0, 0, 5]
                      }
                    ],
                    [
                      {
                        text: title,
                        alignment: 'center',
                        fontSize: 8,
                        color: '#FFFFFF'
                      }
                    ]
                  ]
                }
              },
              {
                text: '',
                margin: [0, 24, 0, 0]
              },
              {
                absolutePosition: {x: 0, y: 230},
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 9,
                    w: 198,
                    h: 60,
                    r: 8,
                    color: 'white'
                  }
                ]
              },
              {
                layout: 'noBorders',
                table: {
                  widths: ['35%', '*'],
                  body: [
                    [
                      {
                        alignment: 'right',
                        margin: 5,
                        stack: [
                          {
                            qr: id,
                            fit: 45
                          }
                        ]
                      },
                      {
                        fontSize: 9,
                        margin: [0, 15, 0, 0],
                        text: 'CAPSULE IO Finance Technology'
                      }
                    ]
                  ]
                }
              }
            ],
            styles: {
              spacer: {
                margin: [0, 15, 0, 0]
              }
            },
            images: {
              background,
              profile,
              logo
            }
          };

          pdfMake.createPdf(docDefinition).print();
        };
      })
      .catch(err => this.notification.error(null, err.error));
  }

  bill(b: Bill, isGrouped?: boolean) {
    const bill = _cloneDeep(b);
    const bill_number = bill.id;
    const contact_phone = this.phoneFormat(bill.Contact.phone);
    const bill_type = bill.Payments.length > 0 ? 'FACTURE' : 'PROFORMA';
    const table_body = this.buildTableBodyBill(bill, isGrouped);
    const connected_user = this.sessionService.getUser().name;

    const dd = {
      footer: {
        text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + connected_user,
        margin: [40, 0],
        fontSize: 9
      },
      pageSize: 'A4',
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content: [
        {
          image: 'logo',
          alignment: 'right',
          width: 100,
          margin: [0, 0, 14, 0]
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 385, y1: 0,
              x2: 487, y2: 0,
              lineWidth: 1.2,
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          columns: [
            {
              width: '*',
              text: [
                {text: (bill.Contact.name || '') + '\n'},
                {text: (contact_phone || '') + '\n'},
                {text: (bill.Contact.address || '') + '\n'}
              ]
            },
            {
              width: 160,
              text: [
                {text: this.company().phone + '\n', alignment: 'center'},
                {text: (this.company().address_1 || '') + '\n' + (this.company().address_2 || '') + '\n', alignment: 'center'},
              ]
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 535, y2: 0,
              lineWidth: 3
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          text: bill_type + ' N° ' + bill_number,
          bold: true,
          fontSize: 12
        },
        {text: '', style: 'separator-xs'},
        {
          style: 'table',
          table: {
            widths: ['*', 70, 100, 100],
            headerRows: 1,
            body: table_body
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === node.table.body.length - 2) {
                return 0.2;
              }

              return 1;
            },
            vLineWidth: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return 0;
              }

              return 1;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === 1 || i === node.table.body.length
                || i === (node.table.body.length - 1) || (i === node.table.body.length - 2)) {
                return 'black';
              }

              return '#b3b5b7'; // gray light
            },
            vLineColor: function (i, node) {
              return '#b3b5b7';
            },
            hLineStyle: function (i, node) {
              if (i === 0 || i === 1 || i === node.table.body.length
                || i === (node.table.body.length - 1)) {
                return null;
              }
              return {dash: {length: 2}};
            },
            vLineStyle: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return null;
              }
              return {dash: {length: 2}};
            }
          }
        },
        {text: '', style: 'separator-sm'},
        {
          text: '',
          alignment: 'justify'
        },
        {
          text: 'Signature et cachet',
          alignment: 'right',
          margin: [0, 30, 60, 0]
        }
      ],
      defaultStyle: {
        fontSize: 11
      },
      styles: {
        'separator-xs': {
          margin: [0, 10]
        },
        'separator-sm': {
          margin: [0, 20]
        },
        table: {
          margin: 0
        },
        'table-header': {
          bold: true,
          margin: 7
        },
        'table-cell': {
          margin: 7
        }
      },
      images: {
        logo: ImageService.logo
      }
    };

    pdfMake.createPdf(dd).print();
  }

  billWithUnit(_bill: Bill): any {
    const bill = _cloneDeep(_bill) as Bill;
    const bill_number = bill.id;
    const contact_phone = this.phoneFormat(bill.Contact.phone);
    const bill_type = bill.Payments.length > 0 ? 'FACTURE' : 'PROFORMA';
    const total_payment = _sumBy(bill.Payments, 'amount');
    const paymentDue = this.invoiceService.getPaymentDue(bill.BillItems);
    const balance = paymentDue - total_payment;
    const user = this.sessionService.getUser();
    const str_print =
      'Imprimé ce ' +
      moment().format('DD MMM YYYY HH:mm') +
      ' par ' +
      user.name;

    const table_body = [];

    const activeMenu = this.sessionService.getActiveMenu();
    const isMen = activeMenu.men && activeMenu.men.root;

    //  Table header
    table_body.push([
      { text: 'Designation', style: 'table-header' },
      { text: 'Unité', style: 'table-header' },
      { text: 'Quantité', style: 'table-header', alignment: 'center' },
      { text: 'Prix Unitaire', style: 'table-header', alignment: 'right' },
      { text: 'TOTAL', style: 'table-header', alignment: 'right' },
    ]);

    for (let i = 0; i < bill.BillItems.length; i++) {
      const item = bill.BillItems[i] as BillItem;

      table_body.push([
        {
          text: [item.name + '\n', item.description],
          style: 'table-cell',
        },
        {
          text: item.ItemUnit ? item.ItemUnit.name : 'Unité',
          style: 'table-cell',
        },
        {
          text: item.quantity,
          alignment: 'center',
          style: 'table-cell',
        },
        {
          text: this.numberFormat(item.price),
          alignment: 'right',
          style: 'table-cell',
        },
        {
          text: this.numberFormat(item.total),
          alignment: 'right',
          style: 'table-cell',
        },
      ]);
    }

    //  Table payment summary
    table_body.push([
      {
        text: '',
        colSpan: 3,
        style: 'table-cell',
        border: [false, false, false, false],
      },
      '',
      '',
      {
        text: 'Total :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true,
      },
      {
        text: this.numberFormat(paymentDue),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right',
      },
    ]);
    table_body.push([
      {
        text: '',
        colSpan: 3,
        style: 'table-cell',
        border: [false, false, false, false],
      },
      '',
      '',
      {
        text: 'Payé :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true,
      },
      {
        text: this.numberFormat(total_payment),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right',
      },
    ]);
    table_body.push([
      {
        text: '',
        colSpan: 3,
        style: 'table-cell',
        border: [false, false, false, false],
      },
      '',
      '',
      {
        text: 'Reste à payer :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true,
      },
      {
        text: 'Ar ' + this.numberFormat(balance),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right',
        bold: true,
      },
    ]);

    const header = [];
    if (isMen) {
      header.push({
        style: 'table',
        table: {
          widths: ['*', 100],
          body: [
            [
              {
                text: 'OFFICE NATIONALE DE LA PREVENTION DES \nACCIDENTS SCOLAIRES DE MADAGASCAR',
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 15, 0, 0],
              },
              {
                width: 70,
                border: [false, false, false, false],
                alignment: 'center',
                image: 'logo_pascoma',
              },
            ],
          ],
        },
      })
    }
    else {
      header.push(
        {
          image: 'logo',
          alignment: 'right',
          width: 100,
          margin: [0, 0, 14, 0]
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 405, y1: 0,
              x2: 507, y2: 0,
              lineWidth: 1.2,
            }
          ]
        }
      );
    }

    const dd = {
      footer: {
        fontSize: 9,
        table: {
          widths: '*',
          body: [
            [
              {
                border: [false, true, false, false],
                alignment: 'center',
                text: [
                  this.company().nif
                    ? 'NIF: ' + this.company().nif + ' - '
                    : '',
                  this.company().stat
                    ? 'N° STAT: ' + this.company().stat + ' - '
                    : '',
                  this.company().rcs
                    ? 'RCS: ' + this.company().rcs + ' - '
                    : '',
                  str_print,
                ],
              },
            ],
          ],
        },
      },
      pageSize: 'A4',
      pageMargins: 20,
      watermark: {
        text: this.company().name,
        opacity: 0.04,
      },
      content: [
        ...header,
        { text: '', style: 'separator-xs' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: (bill.Contact.name || '') + '\n' },
                { text: (contact_phone || '') + '\n' },
                { text: (bill.Contact.address || '') + '\n' },
              ],
            },
            {
              width: 160,
              text: [
                { text: this.company().phone + '\n', alignment: 'center' },
                {
                  text:
                    (this.company().address_1 || '') +
                    '\n' +
                    (this.company().address_2 || '') +
                    '\n',
                  alignment: 'center',
                },
              ],
            },
          ],
        },
        { text: '', style: 'separator-xs' },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 535,
              y2: 0,
              lineWidth: 3,
            },
          ],
        },
        { text: '', style: 'separator-xs' },
        {
          text: bill_type + ' N° ' + bill_number,
          bold: true,
          fontSize: 12,
        },
        { text: '', style: 'separator-xs' },
        {
          style: 'table',
          table: {
            widths: ['*', 70, 50, 100, 100],
            headerRows: 1,
            body: table_body,
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === node.table.body.length - 2) {
                return 0.2;
              }

              return 1;
            },
            vLineWidth: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return 0;
              }

              return 1;
            },
            hLineColor: function (i, node) {
              if (
                i === 0 ||
                i === 1 ||
                i === node.table.body.length ||
                i === node.table.body.length - 1 ||
                i === node.table.body.length - 2
              ) {
                return 'black';
              }

              return '#b3b5b7'; // gray light
            },
            vLineColor: function (i, node) {
              return '#b3b5b7';
            },
            hLineStyle: function (i, node) {
              if (
                i === 0 ||
                i === 1 ||
                i === node.table.body.length ||
                i === node.table.body.length - 1
              ) {
                return null;
              }
              return { dash: { length: 2 } };
            },
            vLineStyle: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return null;
              }
              return { dash: { length: 2 } };
            },
          },
        },
        { text: '', style: 'separator-xs' },
        {
          text: [
            'Arrêté la présente au montant de ',
            {
              text: paymentDue,
              bold: true,
            },
            ' Ar',
          ],
        },
        {
          text: 'Signature et cachet',
          alignment: 'right',
          margin: [0, 30, 60, 0],
        }
      ],
      defaultStyle: {
        fontSize: 10,
      },
      styles: {
        'separator-xs': {
          margin: [0, 10],
        },
        'separator-sm': {
          margin: [0, 20],
        },
        table: {
          margin: 0,
        },
        'table-header': {
          bold: true,
          margin: 7,
        },
        'table-cell': {
          margin: 7,
        },
      },
      images: {
        logo: ImageService.logo,
        logo_pascoma: ImageService.onapascoma,
      },
    };

    pdfMake.createPdf(dd).print();
  }

  //  Inventaire stock
  closing(items) {
    const printedAt = moment().format('DD/MM/YYYY HH:mm');
    const connectedUser = this.sessionService.getUser().name;
    const tableBody = [];

    //  HEADER
    tableBody.push([
      {text: 'ID Stock', style: 'header'},
      {text: 'Libelle', style: 'header'},
      {text: 'SKU', style: 'header'},
      {text: 'Prix d\'achat', style: 'header'},
      {text: 'Prix de vente', style: 'header'},
      {text: 'Qté init.', style: 'header'},
      {text: 'Sortie', style: 'header'},
      {text: 'Reste', style: 'header'},
      {text: 'Qté comptée', style: 'header'},
      {text: 'Observation', style: 'header'}
    ]);

    //  BODY
    items.forEach(elem => {
      tableBody.push([
        {text: elem.id, style: 'td'},
        {text: elem.name, style: 'td', alignment: 'left'},
        {text: elem.sku, style: 'td'},
        {
          text: elem.purchase_price ? this.formatCurrency(elem.purchase_price, '') : '',
          style: 'td'
        },
        {
          text: elem.sale_price ? this.formatCurrency(elem.sale_price, '') : '',
          style: 'td'
        },
        {
          text: elem.type === 'ASSET' ? elem.initial_quantity : '',
          style: 'td'
        },
        {
          text: elem.type === 'ASSET' ? elem.initial_quantity - elem.quantity : '',
          style: 'td'
        },
        {text: elem.quantity, style: 'td'},
        '',
        ''
      ]);
    });

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      // pageMargins: 40,
      header: {
        text: 'INVENTAIRE MOIS DE ',
        alignment: 'center',
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 0]
      },
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            {
              width: '50%',
              text: 'Imprimé ce ' + printedAt + ' par ' + connectedUser,
              fontSize: 9,
              margin: [40, 0, 0, 0]
            },
            {
              width: '50%',
              alignment: 'right',
              fontSize: 9,
              text: 'Page ' + currentPage.toString() + '/' + pageCount,
              margin: [0, 0, 40, 0]
            }
          ]
        };
      },
      content: [
        {
          table: {
            headerRows: 1,
            widths: [
              'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'
            ],
            body: tableBody
          }
        },
        {text: '', style: 'separator'},
        {
          columns: [
            {
              width: '50%',
              text: 'Signature',
              alignment: 'center',
              fontSize: 10
            },
            {
              width: '50%',
              text: 'Signature',
              alignment: 'center',
              fontSize: 10
            }
          ]
        }
      ],
      styles: {
        fontDefault: {
          fontSize: 9
        },
        header: {
          alignment: 'center',
          fontSize: 10,
          bold: true,
          margin: 2
        },
        separator: {
          margin: [0, 0, 0, 20]
        },
        td: {
          alignment: 'center',
          fontSize: 10,
          margin: 2
        }
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  closingByUnit(inventory: any[]) {
    const printedAt = moment().format('DD/MM/YYYY HH:mm');
    const connectedUser = this.sessionService.getUser().name;
    const tableBody = [];

    //  HEADER
    tableBody.push([
      {text: 'ID Stock', style: 'header'},
      {text: 'Désignation', style: 'header'},
      {text: 'SKU', style: 'header'},
      {text: 'Type', style: 'header'},
      {text: 'Unité', style: 'header'},
      {text: 'Reste', style: 'header'},
      {text: 'Qté comptée', style: 'header'},
      {text: 'Observation', style: 'header'}
    ]);

    //  BODY
    inventory.forEach(elem => {
      tableBody.push([
        {text: elem.item_id, style: 'td'},
        {text: elem.item_name, style: 'td', alignment: 'left'},
        {text: elem.item_sku, style: 'td', alignment: 'center'},
        {text: (this.translateService.instant('item_type.' + elem.item_type) || '').toUpperCase(), style: 'td', alignment: 'center'},
        {text: elem.unit_name, style: 'td', alignment: 'left'},
        {text: elem.quantity, style: 'td'},
        '',
        ''
      ]);
    });

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      // pageMargins: 40,
      header: {
        text: 'INVENTAIRE MOIS DE ',
        alignment: 'center',
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 0]
      },
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            {
              width: '50%',
              text: 'Imprimé ce ' + printedAt + ' par ' + connectedUser,
              fontSize: 9,
              margin: [40, 0, 0, 0]
            },
            {
              width: '50%',
              alignment: 'right',
              fontSize: 9,
              text: 'Page ' + currentPage.toString() + '/' + pageCount,
              margin: [0, 0, 40, 0]
            }
          ]
        };
      },
      content: [
        {
          table: {
            headerRows: 1,
            widths: [
              'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'
            ],
            body: tableBody
          }
        },
        {text: '', style: 'separator'},
        {
          columns: [
            {
              width: '50%',
              text: 'Signature',
              alignment: 'center',
              fontSize: 10
            },
            {
              width: '50%',
              text: 'Signature',
              alignment: 'center',
              fontSize: 10
            }
          ]
        }
      ],
      styles: {
        fontDefault: {
          fontSize: 9
        },
        header: {
          alignment: 'center',
          fontSize: 10,
          bold: true,
          margin: 2
        },
        separator: {
          margin: [0, 0, 0, 20]
        },
        td: {
          alignment: 'center',
          fontSize: 10,
          margin: 2
        }
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  customerCard(contact: Contact) {
    const contact_name = contact.name;
    const contact_phone = this.phoneFormat(contact.phone);
    const created = moment().format('DD MMM YYYY HH:mm');
    const code = contact.code;
    const logo = ImageService.logo;

    const docDefinition = {
      pageSize: {width: 240.945, height: 155.906},
      pageMargins: 5,
      content: [
        {
          margin: [0, 5],
          table: {
            widths: ['auto', 40, '*'],
            body: [
              [
                {
                  rowSpan: 4,
                  alignment: 'center',
                  margin: [10, 40],
                  border: [false, false, false, false],
                  stack: [
                    {
                      qr: code,
                      fit: 45
                    }
                  ]
                },
                {
                  colSpan: 2,
                  alignment: 'center',
                  image: 'logo',
                  height: 45,
                  width: 70,
                  border: [false, false, false, false],
                  margin: [0, 0, 0, 5]
                },
                ''
              ],
              [
                '',
                {
                  text: 'Nom',
                  bold: true,
                  border: [false, false, false, false],
                },
                {
                  text: contact_name,
                  border: [false, false, false, true]
                }
              ],
              [
                '',
                {
                  text: 'Tel',
                  bold: true,
                  border: [false, false, false, false],
                },
                {
                  text: contact_phone,
                  border: [false, false, false, true],
                  margin: [0, 5, 0, 0]
                }
              ],
              [
                '',
                {
                  text: 'Fait le',
                  bold: true,
                  border: [false, false, false, false],
                },
                {
                  text: created,
                  border: [false, false, false, true],
                  margin: [0, 5, 0, 0]
                }
              ]
            ]
          }
        }
      ],
      defaultStyle: {
        fontSize: 10
      },
      styles: {
        spacer: {
          margin: [0, 15, 0, 0]
        }
      },
      images: {
        logo
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  incomeStatement(date, summary: any) {
    const printedAt = moment().format('DD/MM/YYYY HH:mm');
    const connectedUser = this.sessionService.getUser().name;
    const start = moment(date.start).format('DD/MM/YYYY');
    const end = moment(date.end).format('DD/MM/YYYY');

    //  BODY
    const tableBody = [
      [
        {text: 'RUBRIQUES', style: 'header'},
        {text: '', style: 'header', alignment: 'right'},
      ],
      [
        {
          text: 'Chiffres d\'affaires(70)',
          style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_70),
          alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Production stockée (71)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_71), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Production immobilisée (72)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_72), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'I - PRODUCTION DE L\'EXERCICE', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.one), alignment: 'right'
        }
      ],
      [
        {
          text: 'Achats consommés (60)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_60), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'letiations de stocks (603)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_603), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Services extérieurs et autres consommations (61-62)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_61 - summary.C_62), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'II - CONSOMMATION DE L\'EXERCICE', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.two), alignment: 'right'
        }
      ],
      [
        {
          text: 'III - VALEUR AJOUTEE D\'EXPLOITATION(I- II)', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.three), alignment: 'right'
        }
      ],
      [
        {
          text: 'Subvention d\'exploitation (74)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_74), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Charges de personnel (64)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_64), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Impôt, taxes et versements assimilés (63)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_63), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'IV - EXCEDENT BRUT D\'EXPLOITATION', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.four), alignment: 'right'
        }
      ],
      [
        {
          text: 'Autres produits opérationnels (75)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_75), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Autres charges opérationnelles (65)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_65), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Dotation aux amortissements, aux provisions et poertes de valeur (68)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_68), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Reprise sur provisions et pertes de valeurs (781)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_781), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'V - RESULTAT OPERATIONNEL', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.five), alignment: 'right'
        }
      ],
      [
        {
          text: 'Produits financiers (76)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_76), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Charges financières (66)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_66), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Reprises financières (786)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_786), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'VI - RESULTAT FINANCIER', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.six), alignment: 'right'
        }
      ],
      [
        {
          text: 'VII - AVANT IMPÖTS (V-VI)', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.seven), alignment: 'right'
        }
      ],
      [
        {
          text: 'Impôts exigibles sur résultats (695)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_695), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Impôts différés (letiations) (692-693)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_692 - summary.C_693), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'TOTAL PRODUITS DES ACTIVITES ORDINAIRES (classe 7)',
          style: 'td',
          italics: true,
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.class_7), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'TOTAL CHARGES DES ACTIVITES ORDINAIRES (classe 6)',
          style: 'td',
          italics: true,
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.class_6), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'VIII - RESULTAT NET DES ACTIVITES ORDINAIRES', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.eight), alignment: 'right'
        }
      ],
      [
        {
          text: 'Élements extraordinaires (produits) (77)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_77), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'Élements extraordinaires (charges) (67)', style: 'td',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.C_67), alignment: 'right',
          border: [true, false, true, false]
        }
      ],
      [
        {
          text: 'IX - RESULTAT EXTRAORDINAIRE', style: 'header',
          border: [true, false, true, false]
        },
        {
          text: this.formatCurrency(summary.nine), alignment: 'right'
        }
      ],
      [
        {
          text: 'X - RESULTAT NET DE L\'EXERCICE(VIII + ou - IX)', style: 'header',
          border: [true, false, true, true]
        },
        {
          text: this.formatCurrency(summary.ten), alignment: 'right'
        }
      ]
    ];

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: 20,
      footer: {
        text: 'Imprimé ce ' + printedAt + ' par ' + connectedUser,
        alignment: 'right',
        fontSize: 9,
        margin: [0, 0, 40, 0]
      },
      content: [
        {
          text: 'COMPTE DE RESULTAT DU ' + start + ' AU ' + end,
          alignment: 'center',
          fontSize: 14,
          bold: true
        },
        {text: '', style: 'separator'},
        {
          table: {
            headerRow: 1,
            widths: ['*', '15%'],
            body: tableBody
          }
        },
        {text: '', style: 'separator'},
        {
          columns: [
            {
              width: '50%',
              text: 'Signature',
              alignment: 'center',
              fontSize: 10
            },
            {
              width: '50%',
              text: 'Signature',
              alignment: 'center',
              fontSize: 10
            }
          ]
        }
      ],
      defaultStyle: {
        fontSize: 10
      },
      styles: {
        header: {
          fontSize: 10,
          bold: true,
          margin: 2
        },
        separator: {
          margin: [0, 0, 0, 10]
        },
        td: {
          fontSize: 10,
          margin: [10, 2],
          border: [false, false, false, false]
        }
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  inventoryOrder(request: Request) {
    const table_body = [];
    const table_history = [];
    const connected_user = this.sessionService.getUser().name;
    const clone = _cloneDeep(request);
    let status = request.status;

    const activeMenu = this.sessionService.getActiveMenu();
    const isMEN = activeMenu.men && activeMenu.men.root;

    const OrderItems = clone.meta && clone.meta.OrderItems ? clone.meta.OrderItems: [];

    status = this.translate.instant('status.' + status).toUpperCase();

    let staffs = [];
    if (request.Staffs) {
      request.Staffs.forEach(staff => {
        staffs.push(staff.name);
      });
    }

    let contacts = [];
    if (request.Contacts) {
      request.Contacts.forEach(contact => {
        contacts.push(contact.name);
      });
    }

    //  START Table Items
    table_body.push([
      {
        colSpan: 3,
        text: 'Produit',
        style: 'thead',
        border: [false, false, false, false]
      },
      '',
      ''
    ]);
    table_body.push([
      {
        text: 'DESIGNATION',
        alignment: 'left',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'QUANTITE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'UNITE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      }
    ]);

    //  Table body

    _forEach(OrderItems, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell'},
        {text: item.quantity, style: 'table-cell', alignment: 'center'},
        {text: item.unit ? item.unit.name : 'Unité', style: 'table-cell', alignment: 'center'}
      ]);
    });

    //  START Table History
    table_history.push([
      {
        colSpan: 3,
        text: 'Historique',
        style: 'thead',
        border: [false, false, false, false]
      },
      '',
      ''
    ]);
    table_history.push([
      {
        text: 'DESCRIPTION',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'DATE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'UTILISATEUR',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      }
    ]);

    let hasHistory = false;

    _forEach(request.RequestHistories, item => {
      let str_status_code = item.status_code;
      if (str_status_code === 'STATUS_UPDATE') {
        hasHistory = true;

        table_history.push([
          {text: this.maintenanceService.formatHistoryDescription(item), style: 'table-cell'},
          {
            text: moment(item.created_at).format('DD/MM/YYYY HH:mm'),
            style: 'table-cell',
            alignment: 'center'
          },
          {text: item.User.name, style: 'table-cell', alignment: 'center'}
        ]);
      }
    });
    //  END Table History

    const footer = {
      text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + connected_user,
      alignment: 'right',
      margin: [40, 0],
      fontSize: 9
    };
    const styles = {
      'separator-xs': {
        margin: [0, 10]
      },
      'separator-sm': {
        margin: [0, 20]
      },
      table: {
        margin: 0
      },
      'table-header': {
        bold: true,
        margin: 7
      },
      'table-cell': {
        margin: 7
      },
      thead: {
        bold: true,
        color: '#ffffff',
        fillColor: '#9e9e9e',
        alignment: 'center'
      },
      td: {
        margin: [0, 5]
      },
      label: {
        bold: true,
        margin: [0, 5]
      }
    };
    const history = {
      style: 'table',
      layout: {
        hLineColor: function (i, node) {
          if (i === 2) {
            return 'black';
          }

          return '#b3b5b7'; // gray light
        },
        hLineStyle: function (i, node) {
          if (i === 2) {
            return null;
          }

          return {dash: {length: 2}};
        },
        vLineWidth: function (i, node) {
          return 0;
        }
      },
      table: {
        widths: ['*', 125, 200],
        headerRows: 1,
        body: table_history
      }
    };
    const separator = {
      text: '', style: 'separator-xs'
    };
    const content: any[] = [
      isMEN ? {
        style: 'table',
        table: {
          widths: ['*', 100],
          body: [
            [
              {
                text: 'OFFICE NATIONALE DE LA PREVENTION DES \nACCIDENTS SCOLAIRES DE MADAGASCAR',
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 15, 0, 0],
              },
              {
                width: 70,
                border: [false, false, false, false],
                alignment: 'center',
                image: 'logo_pascoma',
              },
            ],
          ],
        },
      } : {text: ''},
      {
        columns: [
          {
            width: '*',
            text: 'COMMANDE N° ' + request.id,
            alignment: 'left',
            decoration: 'underline',
            margin: [0, 15, 0, 0],
            fontSize: 14,
            bold: true
          }
        ]
      },
      {text: '', style: 'separator-xs'},
      {
        layout: {
          hLineStyle: function (i, node) {
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['auto', '*', 'auto', '*'],
          body: [
            [
              {
                colSpan: 4,
                text: 'Résumé',
                style: 'thead',
                border: [false, false, false, false]
              },
              '',
              '',
              ''
            ],
            [
              {
                text: 'Établissement :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.Facility ? request.Facility.name : '',
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Statut :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: status,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Récepteur :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: contacts.join(', '),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Catégorie :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.category_name,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Demandé le :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: moment(request.requested_at).format('DD MMM YYYY HH:mm'),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Créé le :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: moment(request.created_at).format('DD MMM YYYY'),
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Assigné à :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: staffs.join(', '),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Créé par :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.User ? request.User.name : '',
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Titre :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.title,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ],
            [
              {
                text: 'Description :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.description,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ],
            [
              {
                text: 'Rapport :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.comments,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ]
          ]
        }
      }
    ];

    if (OrderItems.length > 0) {
      const items = {
        style: 'table',
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }

            return 1;
          },
          hLineColor: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return 'black';
            }

            return '#b3b5b7'; // gray light
          },
          vLineColor: function (i, node) {
            return '#b3b5b7';
          },
          hLineStyle: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return null;
            }
            return {dash: {length: 2}};
          },
          vLineStyle: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return null;
            }
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['*', 70, 100],
          headerRows: 1,
          body: table_body
        }
      };

      content.push(separator);
      content.push(items);

      if (hasHistory) {
        content.push(separator);
        content.push(history);
      }

      content.push(separator);
    }

    const docDefinition = {
      footer,
      pageSize: 'A4',
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content,
      defaultStyle: {
        fontSize: 11
      },
      styles,
      images: {
        logo: ImageService.logo,
        logo_pascoma: ImageService.onapascoma
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  inventoryOut(request: Request) {
    const table_body = [];
    const table_history = [];
    const connected_user = this.sessionService.getUser().name;
    const clone = _cloneDeep(request);
    let isTransfer = false;
    let status = request.status;

    const activeMenu = this.sessionService.getActiveMenu();
    const isMEN = activeMenu.men && activeMenu.men.root;

    status = this.translate.instant('status.' + status).toUpperCase();

    if (request.category_id === +this.settingsCompanyService.getCompanyDefaultSettings('default_inventory_transfer_category')) {
      isTransfer = true;
    }

    let staffs = [];
    if (request.Staffs) {
      request.Staffs.forEach(staff => {
        staffs.push(staff.name);
      });
    }

    let contacts = [];
    if (request.Contacts) {
      request.Contacts.forEach(contact => {
        contacts.push(contact.name);
      });
    }

    //  START Table Items
    table_body.push([
      {
        colSpan: 3,
        text: 'Produit',
        style: 'thead',
        border: [false, false, false, false]
      },
      '',
      ''
    ]);
    table_body.push([
      {
        text: 'DESIGNATION',
        alignment: 'left',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'QUANTITE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'UNITE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      }
    ]);

    //  Table body
    const filteredItemsId = _filter(clone.RequestItems, item => item.item_id !== 0);

    _forEach(filteredItemsId, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell'},
        {text: item.quantity, style: 'table-cell', alignment: 'center'},
        {text: item.unit? item.unit.name: 'Unité', style: 'table-cell', alignment: 'center'}
      ]);
    });

    //  START Table History
    table_history.push([
      {
        colSpan: 3,
        text: 'Historique',
        style: 'thead',
        border: [false, false, false, false]
      },
      '',
      ''
    ]);
    table_history.push([
      {
        text: 'DESCRIPTION',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'DATE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'UTILISATEUR',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      }
    ]);

    let hasHistory = false;

    _forEach(request.RequestHistories, item => {
      let str_status_code = item.status_code;
      if (str_status_code === 'STATUS_UPDATE') {
        hasHistory = true;

        table_history.push([
          {text: this.maintenanceService.formatHistoryDescription(item), style: 'table-cell'},
          {
            text: moment(item.created_at).format('DD/MM/YYYY HH:mm'),
            style: 'table-cell',
            alignment: 'center'
          },
          {text: item.User.name, style: 'table-cell', alignment: 'center'}
        ]);
      }
    });
    //  END Table History

    const footer = {
      text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + connected_user,
      alignment: 'right',
      margin: [40, 0],
      fontSize: 9
    };
    const styles = {
      'separator-xs': {
        margin: [0, 10]
      },
      'separator-sm': {
        margin: [0, 20]
      },
      table: {
        margin: 0
      },
      'table-header': {
        bold: true,
        margin: 7
      },
      'table-cell': {
        margin: 7
      },
      thead: {
        bold: true,
        color: '#ffffff',
        fillColor: '#9e9e9e',
        alignment: 'center'
      },
      td: {
        margin: [0, 5]
      },
      label: {
        bold: true,
        margin: [0, 5]
      }
    };
    const history = {
      style: 'table',
      layout: {
        hLineColor: function (i, node) {
          if (i === 2) {
            return 'black';
          }

          return '#b3b5b7'; // gray light
        },
        hLineStyle: function (i, node) {
          if (i === 2) {
            return null;
          }

          return {dash: {length: 2}};
        },
        vLineWidth: function (i, node) {
          return 0;
        }
      },
      table: {
        widths: ['*', 125, 200],
        headerRows: 1,
        body: table_history
      }
    };
    const separator = {
      text: '', style: 'separator-xs'
    };
    const content: any[] = [
      isMEN? {
        style: 'table',
        table: {
          widths: ['*', 100],
          body: [
            [
              {
                text: 'OFFICE NATIONALE DE LA PREVENTION DES \nACCIDENTS SCOLAIRES DE MADAGASCAR',
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 15, 0, 0],
              },
              {
                width: 70,
                border: [false, false, false, false],
                alignment: 'center',
                image: 'logo_pascoma',
              },
            ],
          ],
        },
      }: {text: ''},
      {
        columns: [
          {
            width: '*',
            text: 'DOCUMENT N° ' + request.id,
            alignment: 'left',
            decoration: 'underline',
            margin: [0, 15, 0, 0],
            fontSize: 14,
            bold: true
          }
        ]
      },
      {text: '', style: 'separator-xs'},
      {
        layout: {
          hLineStyle: function (i, node) {
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['auto', '*', 'auto', '*'],
          body: [
            [
              {
                colSpan: 4,
                text: 'Résumé',
                style: 'thead',
                border: [false, false, false, false]
              },
              '',
              '',
              ''
            ],
            [
              {
                text: 'Local / Service :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.Room ? request.Room.title : '',
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Statut :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: status,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Récepteur :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: contacts.join(', '),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Catégorie :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.category_name,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Demandé le :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: moment(request.requested_at).format('DD MMM YYYY HH:mm'),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Créé le :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: moment(request.created_at).format('DD MMM YYYY'),
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Assigné à :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: staffs.join(', '),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Créé par :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.User? request.User.name: '',
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Titre :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.title,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ],
            [
              {
                text: 'Description :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.description,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ],
            [
              {
                text: 'Rapport :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.comments,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ]
          ]
        }
      }
    ];

    if (request.RequestItems.length > 0) {
      const items = {
        style: 'table',
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }

            return 1;
          },
          hLineColor: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return 'black';
            }

            return '#b3b5b7'; // gray light
          },
          vLineColor: function (i, node) {
            return '#b3b5b7';
          },
          hLineStyle: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return null;
            }
            return {dash: {length: 2}};
          },
          vLineStyle: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return null;
            }
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['*', 70, 100],
          headerRows: 1,
          body: table_body
        }
      };

      content.push(separator);
      content.push(items);

      if (hasHistory) {
        content.push(separator);
        content.push(history);
      }

      content.push(separator);
    }

    if (isMEN) {
      content.push({
        table: isTransfer? {
          widths: ['*', '*'],
          body: [
            [
              {
                text: 'Autorisation du Chef de service',
                border: [false, false, false, false],
                decoration: 'underline',
                margin: [0, 0, 0, 70]
              },
              {
                text: 'Signature du récepteur',
                border: [false, false, false, false],
                decoration: 'underline',
                alignment: 'right',
                margin: [0, 0, 0, 70]
              }
            ],
            [
              {
                text: 'Le Service d\'Appui',
                border: [false, false, false, false],
                decoration: 'underline'
              },
              {
                text: 'L\'Ordonnateur en matières',
                border: [false, false, false, false],
                alignment: 'right',
                decoration: 'underline'
              }
            ]
          ]
        }: {
          widths: ['*', '*', '*'],
          body: [
            [
              {
                text: 'Autorisation du Chef de service',
                border: [false, false, false, false],
                decoration: 'underline'
              },
              {
                text: 'L\'Ordonnateur en matières',
                border: [false, false, false, false],
                decoration: 'underline',
                margin: [0, 50, 0, 0]
              },
              {
                text: 'Signature du récepteur',
                border: [false, false, false, false],
                decoration: 'underline'
              }
            ]
          ]
        }
      });
    }


    const docDefinition = {
      footer,
      pageSize: 'A4',
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content,
      defaultStyle: {
        fontSize: 11
      },
      styles,
      images: {
        logo: ImageService.logo,
        logo_pascoma: ImageService.onapascoma
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  invoice(inv: Invoice, doNotPrint?): any {
    const invoice = _cloneDeep(inv);
    const total = this.invoiceService.getPaymentDue(invoice.InvoiceItems);
    const invoice_number = invoice.id;
    const invoice_type = invoice.Revenues.length > 0 ? 'FACTURE' : 'PROFORMA';
    const table_body = this.buildTableBody(invoice);
    const user = this.sessionService.getUser();
    const str_print = 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + user.name;

    const dd = {
      footer: {
        fontSize: 9,
        table: {
          widths: '*',
          body: [
            [
              {
                border: [false, true, false, false],
                alignment: 'center',
                text: [
                  this.company().nif ? ('NIF: ' + this.company().nif + ' - ') : '',
                  this.company().stat ? ('N° STAT: ' + this.company().stat + ' - ') : '',
                  this.company().rcs ? ('RCS: ' + this.company().rcs + ' - ') : '',
                  str_print
                ]
              }
            ]
          ]
        }
      },
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 18],
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content: [
        {
          columns: [
            {
              width: '*',
              text: ''
            },
            {
              width: 100,
              image: 'logo',
              alignment: 'right',
              margin: [0, 0, 20, 0]
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          columns: [
            {
              width: '*',
              text: invoice_type,
              bold: true,
              fontSize: 20
            },
            {
              width: 190,
              text: [
                {
                  text: (this.company().name).toUpperCase() + '\n',
                  alignment: 'center',
                  bold: true,
                  fontSize: 13
                },
                this.company().phone + '\n',
                this.company().email + '\n',
                this.company().address_1 + '\n' + this.company().address_2,
                /* 'NIF : ' + this.company().nif + '\n',
                'STAT : ' + this.company().stat */
              ],
              alignment: 'center'
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1.5
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          columns: [
            {
              width: '*',
              text: [
                {text: (invoice.Contact.name || '') + '\n'},
                {text: (invoice.Contact.phone || '') + '\n'},
                invoice.Contact.email ? invoice.Contact.email + '\n' : '',
                {text: (invoice.Contact.address || '') + '\n'},
                invoice.Contact.is_business ? 'NIF: ' + (invoice.Contact.meta.nif || '-') + '\n' : '',
                invoice.Contact.is_business ? 'STAT: ' + (invoice.Contact.meta.stat || '-') + '\n' : ''
              ]
            },
            {
              width: 220,
              columns: [
                {
                  width: '*',
                  text: [
                    {text: 'N°\n', alignment: 'left', bold: true},
                    {text: 'Date de facturation\n', alignment: 'left'},
                    {text: 'Date d\'échéance\n', alignment: 'left'},
                    {text: 'Montant total', alignment: 'left'}
                  ]
                },
                {
                  width: '*',
                  text: [
                    {text: ' : ' + invoice_number + '\n', bold: true},
                    {text: ' : ' + moment(invoice.invoiced_at).format('DD MMMM YYYY') + '\n'},
                    {text: ' : ' + moment(invoice.due_at).format('DD MMMM YYYY') + '\n'},
                    {text: ' : ' + this.formatCurrency(total, 'Ar', 'MGA')}
                  ]
                }
              ]
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        /* {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1.5
            }
          ]
        },
        { text: '', style: 'separator-xs' }, */
        {
          style: 'table',
          table: {
            widths: ['*', 70, 100, 100],
            headerRows: 1,
            body: table_body
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === 0) {
                return 0;
              }
              return 1;
            },
            vLineWidth: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return 0;
              }

              return 1;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === 1 || i === node.table.body.length
                || i === node.table.body.length - 1) {
                return 'black';
              }

              return '#b3b5b7'; // gray light
            },
            vLineColor: function (i, node) {
              return '#b3b5b7';
            },
            hLineStyle: function (i, node) {
              if (i === 0 || i === 1 || i === node.table.body.length
                || i === (node.table.body.length - 1)) {
                return null;
              }
              return {dash: {length: 2}};
            },
            vLineStyle: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return null;
              }
              return {dash: {length: 2}};
            }
          }
        },
        {text: '', style: 'separator-sm'},
        {
          text: [
            {text: 'Arrêté la présente ' + invoice_type.toLowerCase() + ' à la somme de : '},
            {text: '"' + NumberToLetter(total) + ' ariary"', bold: true}
          ]
        },
        {text: '', style: 'separator-sm'},
        {
          text: 'Le responsable',
          margin: [0, 0, 55, 0],
          alignment: 'right'
        },
        this.company().signature ? {
          width: 115,
          image: 'signature',
          alignment: 'right',
          margin: [0, 0, 15, 0]
        } : ''
        /* { text: '', style: 'separator-sm' },
        {
          columns: [
            {
              width: '50%',
              text: [
                { text: 'NOTE\n\n', alignment: 'left', bold: true },
                { text: 'Terme de paiement : \n', alignment: 'left' },
                { text: 'Délai de paiement : \n', alignment: 'left' }
              ],
              alignment: 'center',
              margin: [0, 0, 20, 0]
            },
            {
              width: '50%',
              text: [
                { text: '', style: 'separator-xs' },
                { text: (user.Position ? user.Position.title : 'Le responsable') + ',\n\n\n\n\n\n', margin: [0, 0, 20, 0], alignment: 'center' },
                { text: user.name, alignment: 'center' }
              ]
            }
          ]
        } */
      ],
      defaultStyle: {
        fontSize: 11
      },
      styles: {
        'separator-xs': {
          margin: [0, 10]
        },
        'separator-sm': {
          margin: [0, 20]
        },
        table: {
          margin: 0
        },
        'table-header': {
          bold: true,
          margin: 7
        },
        'table-cell': {
          margin: 7
        }
      },
      images: {
        logo: ImageService.logo,
        signature: ImageService.signature
      }
    };

    if (!doNotPrint) pdfMake.createPdf(dd).print();

    return dd;
  }

  invoiceV2(inv: Invoice, doNotPrint?): any {
    const invoice = _cloneDeep(inv);
    const invoice_number = invoice.invoice_number;
    const invoice_type = invoice.status === 'DRAFT' ? 'Facture proforma' : 'Facture'; // draft = PROFORMA
    const table_body = this.buildTableBodyV2(invoice);
    const user = this.sessionService.getUser();
    const str_print = 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + user.name;
    const company = this.company();
    const total_due = this.invoiceService.getPaymentDue(invoice.InvoiceItems);
    const total_payment = this.invoiceService.getTotalPayment(invoice);
    const total_discount = this.invoiceService.getTotalDiscount(invoice.InvoiceItems);
    const total_tax = this.invoiceService.getTotalTax(invoice.InvoiceItems);
    const total_ttc = total_due + total_tax - total_discount;
    const balance = total_ttc - total_payment;

    const mx = 75;

    let revenues: Revenue[] = invoice.Revenues;

    const revenueLabelContent = revenues.map(revenue => {
      return {
        text: this.translateService.instant('payment.' + revenue.payment_method) + '\n' + moment(revenue.paid_at).format('DD/MM/YYYY') + '\n\n'
      }
    });

    const revenueAmountContent = revenues.map(revenue => {
      return {
        text: this.numberFormat(revenue.amount) + '\n\n\n'
      }
    });

    const dd = {
      footer: (currentPage, pageCount) => {
        return [
          /* {
            canvas: [
              {
                type: 'line',
                x1: 40, y1: 0,
                x2: 555, y2: 0,
                lineWidth: 1
              }
            ]
          }, */
          {
            fontSize: 9,
            columns: [
              {
                width: '*',
                border: [false, true, false, false],
                margin: [40, 0, 0, 0],
                alignment: 'left',
                text: [
                  str_print
                ]
              },
              {
                width: 120,
                margin: [0, 0, 40, 0],
                alignment: 'right',
                text: currentPage.toString() + '/' + pageCount.toString()
              }
            ]
          }
        ];
      },
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 18],
      watermark: {
        text: company.name,
        opacity: 0.04
      },
      content: [
        {
          columns: [
            {
              width: '*',
              columns: [
                {
                  width: 43,
                  qr: (invoice.id).toString(),
                  fit: 43
                },
                {
                  width: '*',
                  text: invoice_type,
                  bold: true,
                  margin: [10, 8, 0, 0],
                  fontSize: 20
                }
              ]
            },
            {
              width: 220,
              columns: [
                {
                  width: '*',
                  text: [
                    {text: 'ID: \n'},
                    {text: 'N°: \n'},
                    {text: 'Date: \n'},
                    {text: 'Echéance: '}
                  ]
                },
                {
                  width: '*',
                  text: [
                    {text: invoice.id + '\n', bold: true},
                    {text: invoice_number + '\n', bold: true},
                    {text: moment(invoice.invoiced_at).format('DD/MM/YYYY') + '\n', bold: true},
                    {text: moment(invoice.due_at).format('DD/MM/YYYY') + '\n', bold: true}
                  ]
                }
              ],
              fontSize: 9
            }
          ]
        },
        {text: '', style: 'separator-xxs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 295, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 0.45
            }
          ]
        },
        {text: '', style: 'separator-xxs'},
        {
          columns: [
            {
              width: '*',
              text: [
                {
                  text: (company.name).toUpperCase() + '\n',
                  fontSize: 13
                },
                (company.address_1 || '-') + '\n' + (company.address_2 || '-') + '\n',
                'Tel: ' + (company.phone || '-') + '\n',
                'Email: ' + (company.email || '-') + '\n',
                'NIF: ' + (company.nif || '-') + '\n',
                'STAT: ' + (company.stat || '-')
              ]
            },
            {
              width: 220,
              text: [
                {text: (invoice.Contact.name || '') + '\n'},
                {text: invoice.Contact.address? invoice.Contact.address + '\n': ''},
                invoice.Contact.email ? invoice.Contact.email + '\n' : '',
                {text: invoice.Contact.phone? invoice.Contact.phone + '\n': ''},
                invoice.Contact.is_business ? 'NIF: ' + (invoice.Contact.meta.nif || '-') + '\n' : '',
                invoice.Contact.is_business ? 'STAT: ' + (invoice.Contact.meta.stat || '-') + '\n' : ''
              ]
            }
          ]
        },
        {text: '', style: 'separator-sm'},
        {
          style: 'table',
          table: {
            widths: ['*', 70, 100, 100],
            headerRows: 1,
            body: table_body
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === 1) {
                return 1;
              }
              return 0;
            },
            vLineWidth: function (i, node) {
              return 0;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === 1 || i === node.table.body.length
                || i === node.table.body.length - 1) {
                return 'black';
              }

              return '#b3b5b7'; // gray light
            },
            vLineColor: function (i, node) {
              return '#b3b5b7';
            },
            hLineStyle: function (i, node) {
              if (i === 1) {
                return null;
              }
              return {dash: {length: 1}};
            },
            vLineStyle: function (i, node) {
              return null;
            }
          }
        },
        {text: '', style: 'separator-md'},
        {
          canvas: [
            {
              type: 'line',
              x1: mx, y1: 0,
              x2: 515 - mx, y2: 0,
              lineWidth: 1
            }
          ]
        },
        {text: '', style: 'separator-xxs'},
        {
          margin: [mx, 0, mx, 0],
          columns: [
            {
              width: '*',
              text: [
                {
                  text: 'Total HT\n'
                },
                {
                  text: 'Taxe\n'
                },
                {
                  text: 'Remise\n'
                },
                {
                  text: 'Total TTC\n',
                  bold: true
                },
                {
                  text: 'Montant Payé\n\n'
                }
              ]
            },
            {
              width: '*',
              alignment: 'right',
              text: [
                {
                  text: (this.numberFormat(total_due) || '-') + '\n'
                },
                {
                  text: (total_tax ? this.numberFormat(total_tax): '-') + '\n'
                },
                {
                  text: (total_discount ? this.numberFormat(total_discount): '-') + '\n'
                },
                {
                  text: (this.numberFormat(total_ttc) || '-') + '\n',
                  bold: true
                },
                {
                  text: this.numberFormat(total_payment) + '\n\n'
                }
              ]
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          margin: [mx, 0, mx, 3],
          text: 'Paiement(s): ',
          bold: true
        },
        {
          canvas: [
            {
              type: 'line',
              x1: mx, y1: 0,
              x2: 515 - mx, y2: 0,
              lineWidth: 1,
              dash: {
                length: 1,
                space: 2
              }
            }
          ]
        },
        {text: '', style: 'separator-xxs'},
        revenueLabelContent.length? {
          margin: [mx, 0, mx, 0],
          columns: [
            {
              width: '*',
              text: [
                ...revenueLabelContent,
                {
                  text: '\n\nReste à payer',
                  bold: true
                }
              ]
            },
            {
              width: '*',
              alignment: 'right',
              text: [
                ...revenueAmountContent,
                {
                  text: '\n\n' + (this.numberFormat(balance) || '-'),
                  bold: true
                }
              ]
            }
          ]
        }: {
          margin: [mx, 0, mx, 0],
          text: 'Aucun paiement enregistré'
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: mx, y1: 0,
              x2: 515 - mx, y2: 0,
              lineWidth: 1
            }
          ]
        },
        {text: '', style: 'separator-md'},
        {text: '', style: 'separator-md'},
        {
          text: invoice.notes
        }
      ],
      defaultStyle: {
        fontSize: 10
      },
      styles: {
        'separator-xxs': {
          margin: [0, 4, 0, 2]
        },
        'separator-xs': {
          margin: [0, 10]
        },
        'separator-sm': {
          margin: [0, 20]
        },
        'separator-md': {
          margin: [0, 25]
        },
        table: {
          margin: 0
        },
        'table-header': {
          bold: true,
          margin: 7
        },
        'table-cell': {
          margin: 7
        }
      },
      images: {
        logo: ImageService.logo,
        signature: ImageService.signature
      }
    };

    if (!doNotPrint) pdfMake.createPdf(dd).print();

    return dd;
  }

  invoiceClaim(claim: Request, selected: Bill) {
    let school_year = '';
    if (claim.RequestType) {
      const arr = /(\d*) - (\d*)/g.exec(claim.RequestType.name);
      if (arr[0]) {
        school_year = arr[0];
      }
    }

    const billed_at = moment().format('DD/MM/YY');
    const claim_title = claim.title;
    const facility_name = claim.Facility.name;
    const facility_commune = '-';
    const facility_region = '-';
    const { Student, Warrant } = claim['RequestContacts'];
    const requested_at = moment(claim.requested_at).format('dddd DD/MM/YY');
    const requested_time = claim.event_start;
    const student_age = Student.bio_dob? this.utilityService.getAge(Student.bio_dob): '-';
    const student_dob = Student.bio_dob? moment(Student.bio_dob).format('DD/MM/YY'): '-';
    const student_pob = Student.bio_pob;
    const student_grade = claim.meta.Student.school_grade;
    const student_insurance = claim.meta.Student.school_insurance;
    const student_name = Student.name;
    const student_sex = Student.sex;
    const warrant_cin = Warrant.id_cin || '-';
    const warrant_cin_issued_at = Warrant.meta && Warrant.meta.id_cin_issued_date? moment(Warrant.meta.id_cin_issued_date).format('DD/MM/YY'): '-';
    const warrant_cin_issued_place = Warrant.meta && Warrant.meta.id_cin_delivered_at? Warrant.meta.id_cin_delivered_at : '-';
    const warrant_name = Warrant.name;
    const warrant_phone = Warrant.phone;

    const separatorXS = {text: '', style: 'separator-xs'};
    const table_body = [];

    const paymentDue = this.invoiceService.getPaymentDue(selected.BillItems);

    selected.BillItems.forEach(item => {
      table_body.push([
        {
          text: item.name,
          bold: true,
          decoration: 'underline',
          style: 'table-cell',
          border: [false, false, false, false]
        },
        {
          text: item.description,
          style: 'table-cell',
          border: [false, false, false, false]
        },
        {
          text: [
            {text: 'ST - '},
            this.numberFormat(item.total)
          ],
          bold: true,
          alignment: 'right',
          style: 'table-cell',
          border: [false, true, false, false]
        }
      ])
    });

    const layoutBorder2x = {
      hLineWidth: function (i, node) { return 2; },
      vLineWidth: function (i, node) { return 2; }
    };

    const content = [
      {
        layout: 'noBorders',
        table: {
          widths: ['70%', '15%', '15%'],
          body: [
            [
              {
                text: [school_year, '    ', 102, 4].join('/'),
                // alignment: 'center',
                decoration: 'underline',
                bold: true
              },
              {
                colSpan: 2,
                decoration: 'underline',
                alignment: 'center',
                bold: true,
                text: [
                  'Commission du : ',
                  billed_at
                ]
              },
              ''
            ],
            [
              {
                text: [
                  {text: 'Nom et prénom(s)', style: 'label'},
                  ' : ',
                  {text: student_name, style: 'value'}
                ],
              },
              {
                text: [
                  {text: 'Sexe', style: 'label-r'},
                  ' :'
                ],
                alignment: 'right'
              },
              {text: student_sex, style: 'value'}
            ],
            [
              {
                text: [
                  {text: 'Ecole', style: 'label'},
                  ' : ',
                  {text: facility_name, style: 'value'}
                ]
              },
              {
                text: [
                  {text: 'Classe', style: 'label-r'},
                  ' :'
                ],
                alignment: 'right'
              },
              {text: student_grade, style: 'value'}
            ],
            [
              {
                text: [
                  {text: 'CISCO', style: 'label'},
                  ' : ',
                  {text: facility_region, style: 'value'}
                ],
              },
              {
                text: [
                  {text: 'ZAP', style: 'label-r'},
                  ' :'
                ],
                alignment: 'right'
              },
              {text: facility_commune, style: 'value'}
            ],
            [
              {
                text: [
                  {text: 'Date et lieu de naissance', style: 'label'},
                  ' : ',
                  {text: student_dob, style: 'value'},
                  {text: ' à ', style: 'value'},
                  {text: student_pob, style: 'value'}
                ],
              },
              {
                text: [
                  {text: 'Age', style: 'label-r'},
                  ' :'
                ],
                alignment: 'right'
              },
              {text: student_age, style: 'value'}
            ],
            [
              {
                text: [
                  {text: 'Date et heure de l\'accident', style: 'label'},
                  ' : ',
                  {text: requested_at, style: 'value'},
                  {text: ' à ', style: 'value'},
                  {text: requested_time, style: 'value'}
                ]
              },
              '',
              ''
            ],
            [
              {
                text: [
                  {text: 'Numéro d\'attestation d\'assurance N°', style: 'label'},
                  ' : ',
                  {text: student_insurance, style: 'value'}
                ],
              },
              '',
              ''
            ]
          ]
        }
      },
      separatorXS,
      {
        table: {
          widths: ['auto', '*'],
          body: [
            [
              {
                text: [
                  {text: 'Bénéficiaire', style: 'label-r'},
                  ' : '
                ]
              },
              {text: warrant_name, style: 'value'}
            ],
            [
              {
                text: [
                  {text: 'CIN', style: 'label-r'},
                  ' : '
                ]
              },
              {
                text: [
                  warrant_cin,
                  ' du ',
                  warrant_cin_issued_at,
                  ' à ',
                  warrant_cin_issued_place
                ],
                style: 'value'
              }
            ],
            [
              {
                text: [
                  {text: 'TEL', style: 'label-r'},
                  ' : '
                ]
              },
              {text: warrant_phone, style: 'value'}
            ]
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            return i === 0 || i === node.table.body.length ? 1 : 0;
          },
          vLineWidth: function (i, node) {
            return i === 0 || i === node.table.widths.length ? 1 : 0;
          }
        }
      },
      separatorXS,
      {
        text: [
          {text: 'Motif de l\'accident', style: 'label'},
          ' : ',
          {text: claim_title, style: 'value'}
        ]
      },
      separatorXS,
      {
        table: {
          widths: ['*', 'auto', '15%'],
          body: table_body
        }
      },
      separatorXS,
      {
        table: {
          widths: ['*', '20%'],
          body: [
            [
              {
                text: [
                  {text: 'Remarque :\n', decoration: 'underline'},
                  this.formatCurrency(paymentDue, 'Ar'),
                  ` délibérer au nom de ${warrant_name} cin : ${warrant_cin} du ${warrant_cin_issued_at} à ${warrant_cin_issued_place}`
                ]
              },
              {
                border: [false, false, false, false],
                layout: layoutBorder2x,
                margin: [0, 12],
                table: {
                  widths: ['auto', '*'],
                  body: [
                    [
                      {
                        text: 'TOTAL :',
                        bold: true,
                        border: [false, false, false, false],
                        alignment: 'right'
                      },
                      {
                        text: this.formatCurrency(paymentDue, 'Ar'),
                        alignment: 'center'
                      }
                    ]
                  ]
                }
              }
            ]
          ]
        }
      }
    ];

    const footer = {
      fontSize: 9,
      table: {
        widths: '*',
        body: [
          [
            {
              border: [false, true, false, false],
              alignment: 'center',
              text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + this.sessionService.getUser().name
            }
          ]
        ]
      }
    };

    const styles = {
      label: {
        decoration: 'underline'
      },
      'label-r': {
        alignment: 'right',
        decoration: 'underline',
      },
      value: {
        bold: true
      },
      'separator-xs': {
        margin: [0, 10]
      },
      'separator-xxs': {
        margin: [0, 5]
      },
      'separator-sm': {
        margin: [0, 20]
      },
      table: {
        margin: 0
      },
      'table-header': {
        bold: true,
        margin: 7
      },
      'table-cell': {
        margin: [0, 7, 0, 10]
      }
    };

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [30, 30, 30, 20],
      footer,
      content,
      defaultStyle: {
        fontSize: 11
      },
      styles,
      images: {
        logo: ImageService.logo
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  invoicePascoma(inv: Invoice, doNotPrint?): any {
    const invoice = _cloneDeep(inv) as Invoice;
    const school_year = invoice.meta && invoice.meta.school_year? invoice.meta.school_year: null;
    const paymentDue = this.formatCurrency(this.invoiceService.getPaymentDue(invoice.InvoiceItems));
    const user = this.sessionService.getUser();
    const str_print = 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + user.name;

    const table_body = [];

    //  Table header
    table_body.push([
      {text: 'N°', style: 'table-header'},
      {text: 'Designation', style: 'table-header'},
      {text: 'Date', style: 'table-header'},
      {text: 'Nombre d\'élèves', style: 'table-header'},
      {text: 'Montant Unitaire', style: 'table-header'},
      {text: 'TOTAL', style: 'table-header', alignment: 'right'}
    ]);

    for (let i = 0; i < invoice.InvoiceItems.length; i++) {
      const item = invoice.InvoiceItems[i] as InvoiceItem;

      table_body.push([
        {text: i + 1, alignment: 'center', style: 'table-cell'},
        {
          text: [
            'Règlement suivant DR N° ',
            item.description
          ],
          style: 'table-cell'
        },
        {
          text: '',
          style: 'table-cell'
        },
        {
          text: item.quantity,
          alignment: 'center',
          style: 'table-cell'
        },
        {
          text: this.numberFormat(item.price),
          alignment: 'right',
          style: 'table-cell'
        },
        {
          text: this.numberFormat(item.total),
          alignment: 'right',
          style: 'table-cell'
        }
      ]);
    }

    table_body.push([
      {
        colSpan: 4,
        text: '',
        border: [false, false, false, false]
      },
      '',
      '',
      '',
      {
        text: 'TOTAL',
        alignment: 'right',
        style: 'table-header'
      },
      {
        text: this.numberFormat(paymentDue),
        alignment: 'right',
        style: 'table-header'
      }
    ]);

    const dd = {
      footer: {
        fontSize: 9,
        table: {
          widths: '*',
          body: [
            [
              {
                border: [false, true, false, false],
                alignment: 'center',
                text: [
                  this.company().nif ? ('NIF: ' + this.company().nif + ' - ') : '',
                  this.company().stat ? ('N° STAT: ' + this.company().stat + ' - ') : '',
                  this.company().rcs ? ('RCS: ' + this.company().rcs + ' - ') : '',
                  str_print
                ]
              }
            ]
          ]
        }
      },
      pageSize: 'A4',
      pageMargins: 20,
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content: [
        {
          style: 'table',
          table: {
            widths: ['*', 100],
            body: [
              [
                {
                  text: 'OFFICE NATIONALE DE LA PREVENTION DES \nACCIDENTS SCOLAIRES DE MADAGASCAR',
                  fontSize: 18,
                  bold: true,
                  alignment: 'center',
                  margin: [0, 15, 0, 0]
                },
                {
                  width: 70,
                  border: [false, false, false, false],
                  alignment: 'center',
                  image: 'logo_pascoma'
                }
              ]
            ]
          }
        },
        {text: '', style: 'separator-xs'},
        {
          style: 'table',
          table: {
            widths: ['40%', '30%', '*'],
            body: [
              [
                {
                  text: this.company().address_1
                },
                {
                  text: [
                    'Tél. : ',
                    this.company().phone
                  ]
                },
                ''
              ],
              [
                {
                  text: this.company().address_2
                },
                '',
                ''
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) { return 0; },
            vLineWidth: function (i, node) { return 0;}
          }
        },
        {text: '', style: 'separator-xs'},
        {
          layout: 'noBorders',
          style: 'table',
          table: {
            widths: ['40%', '30%', '30%'],
            body: [
              [
                {
                  text: [
                    'Facturer à : '
                  ]
                },
                {
                  text: [
                    'Cisco : ',
                    {
                      text: invoice.Facility.Geography.Parent.district,
                      bold: true
                    }
                  ]
                },
                {
                  text: [
                    'N° Quittance : ',
                    {
                      text: invoice.invoice_number,
                      bold: true
                    }
                  ]
                }
              ],
              [
                {
                  text: invoice.Contact.name || '',
                  bold: true
                },
                {
                  text: [
                    'Code Etablissement : ',
                    {
                      text: invoice.Facility.id,
                      bold: true
                    }
                  ]
                },
                {
                  text: [
                    'Date de facturation : ',
                    {
                      text: moment(invoice.invoiced_at).format('DD MMMM YYYY'),
                      bold: true
                    }
                  ]
                }
              ],
              [
                {
                  text: [
                    'Numéro d\'adhésion : ',
                    {
                      text: invoice.id,
                      bold: true
                    }
                  ]
                },
                {
                  text: [
                    'Tél. : ',
                    {
                      text: invoice.Contact.phone || '',
                      bold: true
                    }
                  ]
                },
                {
                  text: [
                    'Année scolaire : ',
                    {text: school_year, bold: true}
                  ]
                }
              ]
            ]
          }
        },
        {text: '', style: 'separator-xs'},
        {
          text: 'Objet de la facture : Paiement des cotisations des élèves adhérents à l\'ONaPASCOMA'
        },
        {text: '', style: 'separator-xs'},
        {
          style: 'table',
          table: {
            widths: [30, '*', 'auto', 'auto', 'auto', 70],
            headerRows: 1,
            body: table_body
          },
          layout: {
            fillColor: function (rowIndex, node, columnIndex) {
              return rowIndex === node.table.body.length - 1 && (columnIndex === node.table.widths.length - 1 || columnIndex === node.table.widths.length - 2) ? '#CCCCCC' : null;
            }
          }
        },
        {text: '', style: 'separator-xs'},
        {
          text: [
            'Arrêté la présente au montant de ',
            {
              text: paymentDue,
              bold: true
            },
            ' Ar'
          ]
        },
        {text: '', style: 'separator-sm'},
        {
          alignment: 'center',
          text: 'ONaPASCOMA, ny fiantohana tsara indrindra, dia misaotra anao amin\'ny fahatokisana',
          italics: true
        }
      ],
      defaultStyle: {
        fontSize: 9
      },
      styles: {
        'separator-xs': {
          margin: [0, 10]
        },
        'separator-sm': {
          margin: [0, 20]
        },
        table: {
          margin: 0
        },
        'table-header': {
          bold: true,
          margin: 7
        },
        'table-cell': {
          margin: 7
        }
      },
      images: {
        logo_pascoma: ImageService.onapascoma
      }
    };

    if (!doNotPrint) pdfMake.createPdf(dd).print();

    return dd;
  }

  invoiceGroup(invoiceGroup: InvoiceGroup, isFlatten?) {
    const contact_phone = invoiceGroup.Contact.phone;
    const station = this.company().name;
    const str_print = 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + this.sessionService.getUser().name;

    //  TABLE HEADER
    const table_body = [];

    const table_header_1: any[] = [
      {text: 'N°', style: 'table-header', alignment: 'center', border: [false, true, false, false]},
      {
        text: 'Produit',
        colSpan: 2,
        style: 'table-header',
        border: [false, true, false, false]
      },
      '',
      {text: 'Etat', style: 'table-header', alignment: 'center', border: [false, true, false, false]},
      {text: 'Montant', style: 'table-header', alignment: 'right', border: [false, true, false, false]}
    ];
    table_body.push(table_header_1);

    let annexeDocContent = [];

    //  TABLE BODY
    if (isFlatten && invoiceGroup.hasOwnProperty('InvoiceItems')) {
      invoiceGroup['InvoiceItems'].forEach((item: any) => {
        table_body.push([
          {
            text: item.id,
            alignment: 'center',
            style: 'table-cell'
          },
          {
            text: [
              item.description,
            ],
            style: 'table-cell'
          },
          {
            text: item.quantity,
            alignment: 'center',
            style: 'table-cell'
          },
          {
            text: item.str_status,
            alignment: 'center',
            style: 'table-cell'
          },
          {
            text: this.formatCurrency(item.amount, 'Ar'),
            alignment: 'right',
            style: 'table-cell'
          }
        ]);
      });
    }
    else {
      invoiceGroup.Invoices.forEach((invoice: Invoice) => {
        const invoice_amount = this.invoiceService.getPaymentDue(invoice.InvoiceItems);

        table_body.push([
          {
            text: invoice.id,
            alignment: 'center',
            style: 'table-cell'
          },
          {
            text: invoice.Contact.name,
            colSpan: 2,
            style: 'table-cell'
          },
          '',
          {
            text: invoice['str_status'],
            alignment: 'center',
            style: 'table-cell'
          },
          {
            text: this.formatCurrency(invoice_amount, 'Ar'),
            alignment: 'right',
            style: 'table-cell'
          }
        ]);

        const content = [{text: '', pageBreak: 'after'}].concat(this.invoice(invoice, true).content);
        annexeDocContent = annexeDocContent.concat(content);
      });
    }

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 18],
      pageOrientation: 'portrait',
      watermark: {
        text: station,
        opacity: 0.05
      },
      footer: {
        fontSize: 9,
        table: {
          widths: '*',
          body: [
            [
              {
                border: [false, true, false, false],
                alignment: 'center',
                text: [
                  this.company().nif ? ('NIF: ' + this.company().nif + ' - ') : '',
                  this.company().stat ? ('N° STAT: ' + this.company().stat + ' - ') : '',
                  this.company().rcs ? ('RCS: ' + this.company().rcs + ' - ') : '',
                  str_print
                ]
              }
            ]
          ]
        }
      },
      content: [
        //  PAGE HEADER
        {
          image: 'logo',
          alignment: 'right',
          width: 100,
          margin: [0, 0, 14, 0]
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 385, y1: 0,
              x2: 487, y2: 0,
              lineWidth: 1.2,
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          columns: [
            {
              width: '*',
              text: [
                {text: (invoiceGroup.Contact.name || '') + '\n'},
                {text: (contact_phone || '') + '\n'},
                {text: (invoiceGroup.Contact.address || '') + '\n'}
              ]
            },
            {
              width: 160,
              text: [
                {text: this.company().phone + '\n', alignment: 'center'},
                {text: (this.company().address_1 || '') + '\n' + (this.company().address_2 || '') + '\n', alignment: 'center'},
              ]
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 3
            }
          ]
        },
        {text: '', style: 'separator-xs'},
        {
          text: 'Facture N° ' + invoiceGroup.id,
          bold: true,
          fontSize: 12
        },
        {text: '', style: 'separator-xs'},
        //  TABLE INVOICES
        {
          style: 'table',
          table: {
            headerRows: 1,
            widths: [55, '*', 60, 65, 80],
            body: table_body
          },
          layout: {
            hLineWidth: function (i, node) {
              return 1;
            },
            vLineWidth: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return 0;
              }

              return 1;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === 1) {
                return 'black';
              }

              return '#b3b5b7'; // gray light
            },
            vLineColor: function (i, node) {
              return '#b3b5b7';
            },
            hLineStyle: function (i, node) {
              if (i === 0 || i === 1) {
                return null;
              }
              return {dash: {length: 2}};
            },
            vLineStyle: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return null;
              }
              return {dash: {length: 2}};
            }
          }
        },
        //  TABLE SUMMARY
        {
          style: 'tableStyle',
          table: {
            widths: [300, '*', '*'],
            body: [
              [
                {
                  text: '',
                  alignment: 'center',
                  style: 'table-cell',
                  border: [false, false, false, false]
                },
                {
                  text: 'Sous Total :',
                  style: 'table-cell',
                  border: [false, false, false, true],
                  bold: true
                },
                {
                  text: this.numberFormat(invoiceGroup['Total'].payment_due),
                  style: 'table-cell',
                  border: [false, false, false, true],
                  alignment: 'right'
                }
              ],
              [
                {
                  rowSpan: 4,
                  text: '',
                  style: 'table-cell',
                  border: [false, false, false, false]
                },
                {
                  text: 'Taxe :',
                  style: 'table-cell',
                  border: [false, false, false, true],
                  bold: true
                },
                {
                  text: this.numberFormat(invoiceGroup['Total'].tax),
                  style: 'table-cell',
                  border: [false, false, false, true],
                  alignment: 'right'
                }
              ],
              [
                '',
                {
                  text: 'Remise :',
                  style: 'table-cell',
                  border: [false, false, false, true],
                  bold: true
                },
                {
                  text: this.numberFormat(invoiceGroup['Total'].discount),
                  style: 'table-cell',
                  border: [false, false, false, true],
                  alignment: 'right'
                }
              ],
              [
                '',
                {
                  text: 'Payé :',
                  style: 'table-cell',
                  border: [false, false, false, true],
                  bold: true
                },
                {
                  text: this.formatCurrency(invoiceGroup['Total'].payment, ''),
                  style: 'table-cell',
                  border: [false, false, false, true],
                  alignment: 'right'
                }
              ],
              [
                '',
                {
                  text: 'Total :',
                  style: 'table-cell',
                  border: [false, false, false, true],
                  bold: true
                },
                {
                  text: this.formatCurrency(invoiceGroup['Total'].balance, 'Ar'),
                  style: 'table-cell',
                  border: [false, false, false, true],
                  alignment: 'right', bold: true
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return 1;
            },
            vLineWidth: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return 0;
              }

              return 1;
            },
            hLineColor: function (i, node) {
              if (i === node.table.body.length || i === node.table.body.length - 1) {
                return 'black';
              }

              return '#b3b5b7'; // gray light
            },
            vLineColor: function (i, node) {
              return '#b3b5b7';
            },
            hLineStyle: function (i, node) {
              if (i === node.table.body.length
                || i === (node.table.body.length - 1)) {
                return null;
              }
              return {dash: {length: 2}};
            },
            vLineStyle: function (i, node) {
              if (i === 0 || i === node.table.widths.length) {
                return null;
              }
              return {dash: {length: 2}};
            }
          }
        },
        this.company().signature ? {
          relativePosition: {x: -50, y: -120},
          width: 115,
          image: 'signature',
          alignment: 'right'
        } : ''
      ],
      defaultStyle: {
        fontSize: 11
      },
      styles: {
        'separator-xs': {
          margin: [0, 10]
        },
        'separator-sm': {
          margin: [0, 20]
        },
        table: {
          margin: 0
        },
        'table-header': {
          bold: true,
          margin: 7
        },
        'table-cell': {
          margin: 7
        }
      },
      images: {
        logo: ImageService.logo,
        signature: ImageService.signature
      }
    };

    docDefinition.content = docDefinition.content.concat(annexeDocContent);

    pdfMake.createPdf(docDefinition).print();
  }

  buildCodeContent(tree: HealthDiagnosticCodeNode[], level = 0) {
    const separatorXXS = {
      text: '', style: 'separator-xxs'
    };

    let result = [];
    for (let code of tree) {
      const isQuestion = HealthService.isQuestion(code);
      const isLeaf = isQuestion || !code.Child || !code.Child.length;
      let value: string;

      if (isLeaf) {
        if (isQuestion) {
          if (code.Child && code.Child.length) {
            const condition = (child) => HealthService.parseBooleanValue(child.value);
            if (code.field_type === 'radio') {
              const response = code.Child.find(x => condition(x));
              if (response) {
                value = response.title;
              }
              else {
                value = '-'
              }
            }
            else {
              const response = code.Child.reduce((res: string[], child) => {
                if (condition(child)) {
                  res.push(child.title)
                }
                return res;
              }, []);

              if (response && response.length) {
                value = response.join(' - ');
              }
              else {
                value = '-'
              }
            }
          }
          else {
            value = '-'
          }
        }
        else {
          value = HealthService.getValue(code);
        }
      }

      const label = {
        text: code.title + (value ? ': ' + value : ''),
        fontSize: 12 - 0.5 * level,
        decoration: level === 0 ? 'underline' : undefined,
        bold: code.field_type === 'category',
        margin: [15 * level, 0, 0, 0]
      };
      result.push(label);
      result.push(separatorXXS);

      if (code.Child && code.Child.length && !isQuestion) {
        result = result.concat(this.buildCodeContent(code.Child, level + 1));
      }

      if (level === 0) {
        result.push(separatorXXS);
      }
    }
    return result;
  }

  medicalConsultation(request: Request) {
    const table_body = [];
    const connected_user = this.sessionService.getUser().name;
    const identity = request.Contacts[0];
    const clone = _cloneDeep(request);

    //  START Table Items
    table_body.push([
      {
        text: 'Préscription',
        alignment: 'center',
        border: [true, false, false, true],
        bold: true
      },
      {
        text: 'Quantité',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'Unité',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'Posologie',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'Voie',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'Durée',
        alignment: 'center',
        border: [false, false, true, true],
        bold: true
      }
    ]);

    //  Table body
    const filteredItemsId = _filter(clone.RequestItems, item => item.item_id !== 0);
    const groupedItems = _groupBy(filteredItemsId, item => item.item_id + '|' + item.unit_id);

    for (let key of Object.keys(groupedItems)) {
      let items = groupedItems[key];
      let row: any;

      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (index === 0) {
          row = item;
        }
        else {
          row['quantity'] += item.quantity;
        }
      }

      table_body.push([
        {text: row.name, style: 'table-cell'},
        {text: row.quantity, style: 'table-cell', alignment: 'center'},
        {text: row.ItemUnit? row.ItemUnit.name: '-', style: 'table-cell', alignment: 'center'},
        {text: row.meta.dosage, style: 'table-cell', alignment: 'center'},
        {text: row.meta.administration_mode, style: 'table-cell', alignment: 'center'},
        {text: row.meta.duration + 'j', style: 'table-cell', alignment: 'center'},
      ]);
    }
    //  END Table Items

    const footer = {
      fontSize: 9,
      table: {
        widths: '*',
        body: [
          [
            {
              border: [false, true, false, false],
              alignment: 'center',
              text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + connected_user
            }
          ]
        ]
      }
    };
    const styles = {
      'separator-xxs': {
        margin: [0, 5]
      },
      'separator-xs': {
        margin: [0, 10]
      },
      'separator-sm': {
        margin: [0, 20]
      },
      table: {
        margin: 0
      },
      'table-header': {
        bold: true,
        margin: 7
      },
      'table-cell': {
        margin: 7
      },
      thead: {
        bold: true,
        color: '#ffffff',
        fillColor: '#9e9e9e',
        alignment: 'center'
      },
      td: {
        margin: [0, 5]
      },
      label: {
        bold: true,
        margin: [0, 5]
      }
    };

    const separator = {
      text: '', style: 'separator-xs'
    };
    const separatorXXS = {
      text: '', style: 'separator-xxs'
    };

    let staffs = ''
    request.Staffs.forEach(staff => {
      if (staffs.length) {
        staffs += ', ';
      }

      staffs += staff.name
    });

    const content: any[] = [
      {
        style: 'table',
        table: {
          widths: ['*', 100],
          body: [
            [
              {
                text: 'OFFICE NATIONALE DE LA PREVENTION DES \nACCIDENTS SCOLAIRES DE MADAGASCAR',
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 15, 0, 0],
              },
              {
                width: 70,
                border: [false, false, false, false],
                alignment: 'center',
                image: 'logo_pascoma',
              },
            ],
          ],
        },
      },
      {text: '', style: 'separator-xs'},
      {
        columns: [
          {
            width: '*',
            text: 'FICHE DE CONSULTATION N°' + request.id,
            alignment: 'left',
            decoration: 'underline',
            margin: [0, 5, 0, 0],
            fontSize: 15,
            bold: true
          }
        ]
      },
      {
        text: '', style: 'separator-xs'
      },
      {
        text: [
          {
            text: 'Date: '
          },
          {
            text: moment(request.requested_at).format('DD MMMM YYYY'),
            bold: true
          }
        ],
        fontSize: 11
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Personnels médicaux: '
          },
          {
            text: staffs,
            bold: true
          }
        ],
        fontSize: 11
      },
      separator,
      {
        table: {
          fontSize: 13,
          widths: '*',
          body: [
            [
              {
                border: [true, true, true, true],
                alignment: 'center',
                text: 'IDENTITÉ'
              }
            ]
          ]
        }
      },
      separator,
      {
        text: [
          {
            text: 'Nom et prénom(s): '
          },
          {
            text: identity.name,
            bold: true
          }
        ]
      },
      {
        qr: identity.code.toString(),
        fit: 60,
        absolutePosition: {
          x: 485,
          y: 280
        },
      },
      {
        text: identity.code,
        fontSize: 9,
        absolutePosition: {
          x: 470,
          y: 330
        },
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Genre: '
          },
          {
            text: identity.sex,
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Date de naissance: '
          },
          {
            text: moment(identity.bio_dob).format('DD/MM/YYYY'),
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Etablissement: '
          },
          {
            text: clone.Facility ? clone.Facility.name : '-',
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Classe: '
          },
          {
            text: identity.meta.school_grade,
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'N° matricule: '
          },
          {
            text: identity.meta.school_serial,
            bold: true
          }
        ]
      },
      {
        text: '', style: 'separator-xs'
      }
    ];

    if (request.RequestItems.length > 0) {
      const items = {
        style: 'table',
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            /*if (i === 0 || i === node.table.widths.length) {
              return 0;
            }*/

            return 1;
          },
          hLineColor: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return 'black';
            }

            return '#b3b5b7'; // gray light
          },
          vLineColor: function (i, node) {
            return 'black';
          },
          hLineStyle: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return null;
            }
            return {dash: {length: 2}};
          },
          vLineStyle: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return null;
            }
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['*', 70, 80, 70, 50, 50],
          headerRows: 1,
          body: table_body
        }
      };
      content.push({
        table: {
          fontSize: 13,
          widths: '*',
          body: [
            [
              {
                border: [true, true, true, true],
                alignment: 'center',
                text: 'TRAITEMENT'
              }
            ]
          ]
        }
      });
      content.push(items);
      content.push({
        text: '',
        style: 'separator-sm'
      });
    }

    content.push(
      {
        text: [
          {
            text: 'Conclusion médicale\n',
            bold: true
          },
          {
            text: request.comments || '-'
          }
        ]
      },
      separator,
      {
        text: [
          {
            text: 'Orientation médicale\n',
            bold: true
          },
          {
            text: request.meta.medical_guidance || '-'
          }
        ]
      },
      separator,
      {
        text: [
          {
            text: 'Orientation pédagogique\n',
            bold: true
          },
          {
            text: request.meta.pedagogical_guidance || '-'
          }
        ]
      },
      separator,
      {
        text: [
          {
            text: 'Observation / Référence\n',
            bold: true
          },
          {
            text: request.meta.observation || '-'
          }
        ]
      },
      {
        text: '',
        style: 'separator-sm'
      },
      {
        text: '',
        style: 'separator-sm'
      },
      {
        text: request.Staffs[0].name,
        alignment: 'right'
      }
    );

    const docDefinition = {
      pageMargins: [40, 30, 40, 18],
      footer,
      pageSize: 'A4',
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content,
      defaultStyle: {
        fontSize: 11
      },
      styles,
      images: {
        logo: ImageService.logo,
        logo_pascoma: ImageService.onapascoma
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  async medicalDiagnostic(request: Request, tree?: HealthDiagnosticCodeNode[], codes?: HealthDiagnosticCodeNode[]) {
    const separator = {
      text: '', style: 'separator-xs'
    };
    const separatorXXS = {
      text: '', style: 'separator-xxs'
    };
    const identity = request.Contacts[0];
    if (!tree) {
      tree = await this.healthService.getHealthTree(request.RequestType.id);
    }
    const codeContent = this.buildCodeContent(HealthService.mapTreeToTrackers(tree, codes));
    let staffs = ''
    request.Staffs.forEach(staff => {
      if (staffs.length) {
        staffs += ', ';
      }

      staffs += staff.name
    });
    const content: any[] = [
      {
        style: 'table',
        table: {
          widths: ['*', 100],
          body: [
            [
              {
                text: 'OFFICE NATIONALE DE LA PREVENTION DES \nACCIDENTS SCOLAIRES DE MADAGASCAR',
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 15, 0, 0],
              },
              {
                width: 70,
                border: [false, false, false, false],
                alignment: 'center',
                image: 'logo_pascoma',
              },
            ],
          ],
        },
      },
      {
        columns: [
          {
            width: '*',
            text: 'FICHE DE VISITE MEDICALE N°' + request.id,
            alignment: 'left',
            decoration: 'underline',
            margin: [0, 5, 0, 0],
            fontSize: 15,
            bold: true
          }
        ]
      },
      {
        text: '', style: 'separator-xs'
      },
      {
        text: [
          {
            text: 'Date: '
          },
          {
            text: moment(request.requested_at).format('DD MMMM YYYY'),
            bold: true
          }
        ],
        fontSize: 11
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Personnels médicaux: '
          },
          {
            text: staffs,
            bold: true
          }
        ],
        fontSize: 11
      },
      separator,
      {
        table: {
          fontSize: 13,
          widths: '*',
          body: [
            [
              {
                border: [true, true, true, true],
                alignment: 'center',
                text: 'IDENTITÉ'
              }
            ]
          ]
        }
      },
      separator,
      {
        text: [
          {
            text: 'Nom et prénom(s): '
          },
          {
            text: identity.name,
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        qr: identity.code.toString(),
        fit: 60,
        absolutePosition: {
          x: 485,
          y: 260
        },
      },
      {
        text: identity.code,
        fontSize: 9,
        absolutePosition: {
          x: 470,
          y: 310
        },
      },
      {
        text: [
          {
            text: 'Genre: '
          },
          {
            text: identity.sex,
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Date de naissance: '
          },
          {
            text: moment(identity.bio_dob).format('DD/MM/YYYY'),
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Etablissement: '
          },
          {
            text: request.Facility ? request.Facility.name : '-',
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'Classe: '
          },
          {
            text: identity.meta.school_grade || '-',
            bold: true
          }
        ]
      },
      separatorXXS,
      {
        text: [
          {
            text: 'N° matricule: '
          },
          {
            text: identity.meta.school_serial || '-',
            bold: true
          }
        ]
      },
      {
        text: '', style: 'separator-xs'
      },
      {
        table: {
          fontSize: 13,
          widths: '*',
          body: [
            [
              {
                border: [true, true, true, true],
                alignment: 'center',
                text: 'PARAMÈTRES'
              }
            ]
          ]
        }
      },
      {
        text: '', style: 'separator-xs'
      },
      ...codeContent
    ];

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 18],
      footer: {
        fontSize: 9,
        table: {
          widths: '*',
          body: [
            [
              {
                border: [false, true, false, false],
                alignment: 'center',
                text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + this.sessionService.getUser().name
              }
            ]
          ]
        }
      },
      content,
      defaultStyle: {
        fontSize: 11
      },
      styles: {
        'separator-xs': {
          margin: [0, 10]
        },
        'separator-xxs': {
          margin: [0, 5]
        },
        'separator-sm': {
          margin: [0, 20]
        },
        table: {
          margin: 0
        },
        'table-header': {
          bold: true,
          margin: 7
        },
        'table-cell': {
          margin: 7
        }
      },
      images: {
        logo: ImageService.logo,
        logo_pascoma: ImageService.onapascoma
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  pay() {
    const connected_user = this.sessionService.getUser().name;
    const str_print = 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + connected_user;
    const styles = {
      'separator-xs': {
        margin: [0, 10]
      },
      'separator-sm': {
        margin: [0, 20]
      },
      table: {
        margin: 0
      },
      'table-header': {
        bold: true,
        margin: 7
      },
      'table-cell': {
        margin: 7
      },
      thead: {
        bold: true,
        color: '#ffffff',
        fillColor: '#9e9e9e',
        alignment: 'center'
      },
      td: {
        margin: [0, 5]
      },
      label: {
        bold: true,
        margin: [0, 5]
      }
    };

    const dd = {
      footer: {
        fontSize: 9,
        table: {
          widths: '*',
          body: [
            [
              {
                border: [false, true, false, false],
                alignment: 'center',
                text: [
                  str_print
                ]
              }
            ]
          ]
        }
      },
      defaultStyle: {
        fontSize: 11
      },
      styles,
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 18],
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content: [
        {text: 'BULLETIN DE PAYE', fontSize: 15, alignment: 'center', bold: true},
        {text: '', style: 'separator-sm'},
        {
          text: 'Nom et raison sociale de l\'employeur : .................................................................................................................'
        },
        {
          text: 'Nom et prénoms du travailleur : ............................................................................................................................'
        },
        {
          text: 'Fonction : ............................................................... N° matricule : ........................................................................'
        },
        {
          text: 'Classification personnelle : ....................................................... Indice : ..............................................................'
        },
        {
          text: 'Paye du ............................................ pour la période du ........................................ au .........................................'
        },
        {text: '', style: 'separator-xs'},
        {text: 'SALAIRE DE BASE', fontSize: 13, alignment: 'center', bold: true},
        {text: '', style: 'separator-sm'},
        {
          text: '............................................. mois journées ou heures à .................................................'
        },
        {
          text: '............................................. vacation ou pièces ............ à ..............................................'
        },
        {
          text: '............................................. heures supplémentaires à ..................................................'
        },
        {
          text: '............................................. heures supplémentaires à ..................................................'
        },
        {text: '', style: 'separator-xs'},
        {
          text: 'Prime d\'ancienneté ............................................................................................................'
        },
        {
          text: 'Prime de rendement ..........................................................................................................'
        },
        {
          text: 'Primes diverses .................................................................................................................'
        },
        {
          text: 'Rénumération totale brute .......................................................................................................................', margin: [35, 0, 0, 0]
        },
        {text: 'DEDUCTIONS REGLEMENTAIRES : ', fontSize: 13, style: 'separator-xs'},
        {text: 'Avances .............................................................................................................................'},
        {
          text: 'Retenue CNAPS ................................................................................................................'
        },
        {
          text: 'Retenue OSTIE ..................................................................................................................'
        },
        {
          text: 'Retenue diverses ..............................................................................................................'
        },
        {
          text: 'Retenue IRSA (après abattement 20%) ...........................................................................'
        },
        {
          text: 'Total ..................................................'
        },
        {text: '', style: 'separator-xs'},
        {
          text: 'Montant de la paye .....................................', margin: [100, 0, 0, 0]
        },
        {
          text: 'Allocation familiales ...................................', margin: [100, 0, 0, 0]
        },
        {
          text: 'TOTAL GENERAL .........................................', margin: [100, 0, 0, 0]
        },
        {text: '', style: 'separator-sm'},
        {
          text: 'Avantage en nature : ..............................................................................................................................................'
        },
        {
          text: 'Dates des journées d\'absences régulières ...........................................................................................................'
        },
        {
          text: 'Dates des journées d\'absences irrégulières .........................................................................................................'
        },
        {text: '', style: 'separator-xs'},
        {
          text: 'Emargement du salarié',
          bold: true,
          alignment: 'right',
          margin: [0, 0, 70, 0]
        },
        {
          table: {
            widths: ['35%', '*'],
            body: [
              [{
                text: [
                  {
                    text: 'Abattement           % ..........................\n'
                  },
                  {
                    text: 'Montant imposable ..........................'
                  }
                ],
                border: [true, true, true, true]
              }],
              [{
                text: '',
                border: [false, false, false, false]
              }]
            ]
          }
        },
        {
          canvas:
          [
              {
                type: 'polyline',
                lineWidth: 1,
                points: [
                  { x: 345, y: 205},
                  { x: 345, y: 492 },
                  { x: 448, y: 492 },
                  { x: 448, y: 205 }
                ]
              },
              {
                type: 'polyline',
                lineWidth: 1,
                points: [
                  { x: 550, y: 205 },
                  { x: 550, y: 550 },
                  { x: 448, y: 550 },
                  { x: 448, y: 492 }
                ]
              },
              {
                type: 'line',
                x1: 448, y1: 370,
                x2: 550, y2: 370,
                lineWidth: 1
              },
              {
                type: 'line',
                x1: 448, y1: 492,
                x2: 550, y2: 492,
                lineWidth: 1
              },
              {
                type: 'line',
                x1: 448, y1: 525,
                x2: 550, y2: 525,
                lineWidth: 1
              }
          ],
          absolutePosition: {x: 0, y: 0}
        }
      ],
      images: {
        logo: ImageService.logo
      },
    };

    pdfMake.createPdf(dd).print();
  }

  receipt(invoice: Invoice) {
    const arrival_station = invoice.InvoiceItems[0].name.toUpperCase();
    const seats = invoice.InvoiceItems.length;
    const str_client = invoice.Contact.name;
    const str_copyright = 'Powered by CAPSULE IO Finance Technology';
    const str_station = this.company().name;
    const title = [
      {
        text: str_station,
        bold: true,
        fontSize: 12
      },
      {
        text: '\n' + str_copyright
      },
      {
        text: '\n N° ' + invoice.id,
        fontSize: 12,
        bold: true
      }
    ];
    const str_departure_date = moment(invoice.due_at).format('DD/MM/YYYY');
    const str_invoice = 'N° ' + invoice.id;
    const str_phone = this.phoneFormat(invoice.Contact.phone);
    const str_timestamp = moment().format('DD/MM/YYYY \à HH:mm');
    const str_user = 'Imprimé par ' + this.sessionService.getUser().name;
    const str_footer = str_user + '\n' + str_timestamp + ' - ' + str_invoice;
    const payment_due = this.formatCurrency(invoice.amount, 'Ar');

    const docDefinition = {
      watermark: {
        text: str_station,
        opacity: 0.05
      },
      pageSize: {
        width: 226,
        height: 'auto'
      },
      pageMargins: [5, 15],
      content: [
        {
          text: title,
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          table: {
            widths: [45, '*'],
            body: [
              [
                {
                  rowSpan: 2,
                  qr: invoice.id.toString(),
                  fit: 43,
                  alignment: 'center',
                  margin: [0, 5, 0, 0],
                  border: [false, false, false, false]
                },
                {
                  text: [
                    {
                      text: 'Destination : \n'
                    },
                    {
                      text: arrival_station,
                      fontSize: 12,
                      bold: true
                    }
                  ],
                  border: [false, true, false, true]
                }
              ],
              [
                '',
                {
                  text: [
                    {
                      text: 'Date : \n'
                    },
                    {
                      text: str_departure_date,
                      fontSize: 12,
                      bold: true
                    }
                  ],
                  border: [false, false, false, true]
                }
              ]
            ]
          }
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  colSpan: 2,
                  text: [
                    {
                      text: 'Nom : \n'
                    },
                    {
                      text: str_client,
                      style: 'value'
                    }
                  ],
                  border: [false, false, false, true]
                },
                ''
              ],
              [
                {
                  text: [
                    {
                      text: 'Tél : \n'
                    },
                    {
                      text: str_phone,
                      style: 'value'
                    }
                  ],
                  border: [false, false, false, true]
                },
                {
                  text: [
                    {
                      text: 'Places : \n'
                    },
                    {
                      text: seats,
                      style: 'value'
                    }
                  ],
                  border: [false, false, false, true]
                }
              ],
              [
                {
                  text: [
                    {
                      text: 'Montant : \n'
                    },
                    {
                      text: payment_due,
                      style: 'value'
                    }
                  ],
                  border: [false, false, false, true]
                },
                {
                  text: [
                    {
                      text: 'N° Ticket : \n'
                    },
                    {
                      text: invoice.id,
                      style: 'value'
                    }
                  ],
                  border: [false, false, false, true]
                }
              ]
            ]
          }
        },
        {
          text: str_footer,
          alignment: 'center',
          margin: [0, 10, 0, 0]
        }
      ],
      images: {
        logo: ImageService.logo
      },
      defaultStyle: {
        fontSize: 8
      },
      styles: {
        label: {
          margin: [0, 0, 0, 2]
        },
        value: {
          fontSize: 10,
          bold: true
        }
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  request(request: Request) {
    const table_body = [];
    const table_history = [];
    const connected_user = this.sessionService.getUser().name;
    const clone = _cloneDeep(request);
    let status = request.status;
    const total_due = this.invoiceService.getPaymentDue(clone.RequestItems);

    const sub = this.translate.get('status.' + status).subscribe((text: string) => {
      status = text.toUpperCase();
    });
    this.subscriptions.push(sub);

    let staffs = [];
    if (request.Staffs) {
      request.Staffs.forEach(staff => {
        staffs.push(staff.name);
      });
    }

    let contacts = [];
    if (request.Contacts) {
      request.Contacts.forEach(contact => {
        contacts.push(contact.name);
      });
    }

    //  START Table Items
    table_body.push([
      {
        colSpan: 4,
        text: 'Produit / Service',
        style: 'thead',
        border: [false, false, false, false]
      },
      '',
      '',
      ''
    ]);
    table_body.push([
      {
        text: 'PRODUIT',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'QUANTITE',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'PRIX',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'TOTAL',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      }
    ]);

    //  Table body
    const filteredItems = _filter(clone.RequestItems, {item_id: 0});
    const filteredItemsId = _filter(clone.RequestItems, item => item.item_id !== 0);
    const groupedItems = _groupBy(filteredItemsId, 'item_id');

    _forEach(groupedItems, items => {
      let row: any;

      _forEach(items, (item, index) => {
        if (index === 0) {
          row = item;
        }
        else {
          row['quantity'] += item.quantity;
          row['total'] += item.total;
        }
      });

      const meta = row.meta ? '\n' + row.meta : '';

      table_body.push([
        {text: row.name + meta, style: 'table-cell'},
        {text: row.quantity, style: 'table-cell', alignment: 'center'},
        {text: this.numberFormat(row.price), style: 'table-cell', alignment: 'right'},
        {text: this.numberFormat(row.quantity * row.price), style: 'table-cell', alignment: 'right'}
      ]);
    });

    _forEach(filteredItems, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell'},
        {text: item.quantity, style: 'table-cell', alignment: 'center'},
        {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right'},
        {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right'}
      ]);
    });

    //  Table summary
    table_body.push([
      {text: '', colSpan: 2, style: 'table-cell', border: [false, false, false, false]},
      '',
      {
        text: 'Sous Total :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.numberFormat(total_due),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      {text: '', colSpan: 2, style: 'table-cell', border: [false, false, false, false]},
      '',
      {
        text: 'Total :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.formatCurrency(total_due, 'Ar'),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right', bold: true
      }
    ]);
    //  END Table Items

    //  START Table History
    table_history.push([
      {
        colSpan: 4,
        text: 'Historique',
        style: 'thead',
        border: [false, false, false, false]
      },
      '',
      '',
      ''
    ]);
    table_history.push([
      {
        text: 'DESCRIPTION',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'CRÉÉ',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'ACTION',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'UTILISATEUR',
        alignment: 'center',
        border: [false, false, false, true],
        bold: true
      }
    ]);

    _forEach(request.RequestHistories, item => {
      let str_status_code = item.status_code;
      const sub = this.translate.get('status.' + item.status_code).subscribe((text: string) => {
        str_status_code = text;
      });
      this.subscriptions.push(sub);

      table_history.push([
        {text: this.maintenanceService.formatHistoryDescription(item), style: 'table-cell'},
        {
          text: moment(item.created_at).format('DD/MM/YYYY HH:mm'),
          style: 'table-cell',
          alignment: 'center'
        },
        {text: str_status_code, style: 'table-cell', alignment: 'center'},
        {text: item.User.name, style: 'table-cell', alignment: 'center'}
      ]);
    });
    //  END Table History

    const footer = {
      text: 'Imprimé ce ' + moment().format('DD MMM YYYY HH:mm') + ' par ' + connected_user,
      alignment: 'right',
      margin: [40, 0],
      fontSize: 9
    };
    const styles = {
      'separator-xs': {
        margin: [0, 10]
      },
      'separator-sm': {
        margin: [0, 20]
      },
      table: {
        margin: 0
      },
      'table-header': {
        bold: true,
        margin: 7
      },
      'table-cell': {
        margin: 7
      },
      thead: {
        bold: true,
        color: '#ffffff',
        fillColor: '#9e9e9e',
        alignment: 'center'
      },
      td: {
        margin: [0, 5]
      },
      label: {
        bold: true,
        margin: [0, 5]
      }
    };
    const history = {
      pageBreak: 'before',
      style: 'table',
      layout: {
        hLineColor: function (i, node) {
          if (i === 2) {
            return 'black';
          }

          return '#b3b5b7'; // gray light
        },
        hLineStyle: function (i, node) {
          if (i === 2) {
            return null;
          }

          return {dash: {length: 2}};
        },
        vLineWidth: function (i, node) {
          return 0;
        }
      },
      table: {
        widths: ['*', 80, 80, 100],
        headerRows: 1,
        body: table_history
      }
    };
    const separator = {
      text: '', style: 'separator-xs'
    };
    const content: any[] = [
      {
        columns: [
          {
            width: '*',
            text: 'REQUÊTE N° ' + request.id,
            alignment: 'center',
            decoration: 'underline',
            margin: [0, 15, 0, 0],
            fontSize: 15,
            bold: true
          },
          {
            width: 'auto',
            stack: [
              {
                qr: request.id.toString(),
                fit: 50,
                alignment: 'center'
              },
              {
                text: request.id,
                alignment: 'center',
                fontSize: 7
              }
            ]
          }
        ]
      },
      {text: '', style: 'separator-xs'},
      {
        layout: {
          hLineStyle: function (i, node) {
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['auto', '*', 'auto', '*'],
          body: [
            [
              {
                colSpan: 4,
                text: 'Résumé',
                style: 'thead',
                border: [false, false, false, false]
              },
              '',
              '',
              ''
            ],
            [
              {
                text: 'Local',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.Room ? request.Room.title : '',
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Statut :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: status,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Contact :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: contacts.join(', '),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Catégorie :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.category_name,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Fait le :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.requested_at? moment(request.requested_at).format('DD MMM YYYY HH:mm'): '',
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Deadline :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.due_at? moment(request.due_at).format('DD MMM YYYY'): '',
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Assigné à :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: staffs.join(', '),
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Créé par :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.User? request.User.name: '',
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Extension :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.RequestType ? request.RequestType : null,
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'État :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.RequestStatus ? request.RequestStatus : null,
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Titre :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.title,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ],
            [
              {
                text: 'Description :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.description,
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ],
            [
              {
                text: 'Intervention :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                colSpan: 3,
                text: request.comments ? this.utilityService.getTextFromHtml(request.comments) : '',
                border: [false, false, false, true],
                style: 'td'
              },
              '',
              ''
            ]
          ]
        }
      },
      {text: '', style: 'separator-xs'},
      {
        layout: {
          hLineStyle: function (i, node) {
            if (i === 2) {
              return null;
            }

            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['auto', '*', 'auto', '*'],
          body: [
            [
              {
                colSpan: 4,
                text: 'VISA',
                style: 'thead',
                border: [false, false, false, false]
              },
              '',
              '',
              ''
            ],
            [
              {
                colSpan: 2,
                text: 'TECHNICIEN',
                border: [false, false, false, true],
                bold: true,
                alignment: 'center'
              },
              '',
              {
                colSpan: 2,
                text: 'CLIENT',
                border: [false, false, false, true],
                bold: true,
                alignment: 'center'
              },
              ''
            ],
            [
              {
                text: 'Nom : ',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.Staffs.length ? request.Staffs[0].name : '',
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Nom : ',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: request.Contacts.length ? request.Contacts[0].name : '',
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                text: 'Date :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: '',
                border: [false, false, false, true],
                style: 'td'
              },
              {
                text: 'Date :',
                border: [false, false, false, false],
                style: 'label'
              },
              {
                text: '',
                border: [false, false, false, true],
                style: 'td'
              }
            ],
            [
              {
                colSpan: 2,
                text: 'Signature',
                border: [false, false, false, false],
                bold: true,
                alignment: 'center',
                margin: [0, 20, 0, 0]
              },
              '',
              {
                colSpan: 2,
                text: 'Signature',
                border: [false, false, false, false],
                bold: true,
                alignment: 'center',
                margin: [0, 20, 0, 0]
              },
              ''
            ]
          ]
        }
      }
    ];

    if (request.RequestItems.length > 0) {
      const items = {
        pageBreak: 'before',
        style: 'table',
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }

            return 1;
          },
          hLineColor: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return 'black';
            }

            return '#b3b5b7'; // gray light
          },
          vLineColor: function (i, node) {
            return '#b3b5b7';
          },
          hLineStyle: function (i, node) {
            if (i === 0 || i === 1 || i === 2 || i === node.table.body.length
              || i === (node.table.body.length - 1)) {
              return null;
            }
            return {dash: {length: 2}};
          },
          vLineStyle: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return null;
            }
            return {dash: {length: 2}};
          }
        },
        table: {
          widths: ['*', 70, 100, 100],
          headerRows: 1,
          body: table_body
        }
      };

      content.push(items);
      content.push(separator);
      delete history.pageBreak;
    }
    if (request.RequestHistories.length > 0) {
      content.push(history);
    }

    const docDefinition = {
      footer,
      pageSize: 'A4',
      watermark: {
        text: this.company().name,
        opacity: 0.04
      },
      content,
      defaultStyle: {
        fontSize: 11
      },
      styles,
      images: {
        logo: ImageService.logo
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  buildTableBody(invoice: Invoice, rooms?: Room[], currency?: Currency): Array<any> {
    const table_body = [];
    const total_due = this.invoiceService.getPaymentDue(invoice.InvoiceItems, rooms);
    const total_payment = this.invoiceService.getTotalPayment(invoice);
    const total_discount = this.invoiceService.getTotalDiscount(invoice.InvoiceItems);
    const total_tax = this.invoiceService.getTotalTax(invoice.InvoiceItems);
    const balance = total_due + total_tax - total_discount - total_payment;

    //  Table header
    table_body.push([
      {text: 'PRODUIT', style: 'table-header', border: [false, true, false, false]},
      {text: 'QUANTITE', style: 'table-header', border: [false, true, false, false], alignment: 'center'},
      {text: 'PRIX', style: 'table-header', border: [false, true, false, false], alignment: 'right'},
      {text: 'TOTAL', style: 'table-header', border: [false, true, false, false], alignment: 'right'}
    ]);

    const filteredRooms = invoice.InvoiceItems.filter(item => {
      return item.item_id !== null && item.item_type === 'ROOM';
    });

    _forEach(filteredRooms, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell'},
        {text: item.quantity, style: 'table-cell', alignment: 'center'},
        {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right'},
        {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right'}
      ]);
    });

    const filteredItemsId = _filter(invoice.InvoiceItems, item => item.item_id !== null && item.item_type !== 'ROOM');
    const groupedItems = _groupBy(filteredItemsId, 'item_id');

    _forEach(groupedItems, items => {
      let row: any;

      _forEach(items, (item, index) => {
        if (index === 0) {
          row = item;
        }
        else {
          row['quantity'] += item.quantity;
          row['total'] += item.total;
        }
      });

      const meta = row.description ? '\n' + row.description : '';

      table_body.push([
        {text: row.name + meta, style: 'table-cell'},
        {text: row.quantity, style: 'table-cell', alignment: 'center'},
        {text: this.numberFormat(row.price), style: 'table-cell', alignment: 'right'},
        {text: this.numberFormat(row.quantity * row.price), style: 'table-cell', alignment: 'right'}
      ]);
    });

    const filteredItems = _filter(invoice.InvoiceItems, {item_id: null});

    _forEach(filteredItems, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell'},
        {text: item.quantity, style: 'table-cell', alignment: 'center'},
        {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right'},
        {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right'}
      ]);
    });

    //  Table summary
    table_body.push([
      {
        text: '',
        colSpan: 2,
        alignment: 'center',
        style: 'table-cell',
        border: [false, false, false, false]
      },
      '',
      {
        text: 'Sous Total :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.numberFormat(total_due),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      {
        colSpan: 2,
        rowSpan: 4,
        text: '',
        style: 'table-cell',
        border: [false, false, false, false]
      },
      '',
      {
        text: 'Taxe :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: total_tax ? this.numberFormat(total_tax) : '-',
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      '',
      '',
      {
        text: 'Remise :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: total_discount ? this.numberFormat(total_discount) : '-',
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      '',
      '',
      {
        text: 'Payé :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.formatCurrency(total_payment, ''),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      '',
      '',
      {
        text: 'Reste à payer :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.formatCurrency(balance, 'Ar'),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right', bold: true
      }
    ]);

    return table_body;
  }

  buildTableBodyV2(invoice: Invoice, rooms?: Room[], currency?: Currency): Array<any> {
    const table_body = [];

    //  Table header
    table_body.push([
      {text: 'ARTICLE', style: 'table-header', border: [false, true, false, false]},
      {text: 'QUANTITE', style: 'table-header', border: [false, true, false, false], alignment: 'center'},
      {text: 'P.U. HT', style: 'table-header', border: [false, true, false, false], alignment: 'right'},
      {text: 'TOTAL HT', style: 'table-header', border: [false, true, false, false], alignment: 'right'}
    ]);

    const filteredRooms = invoice.InvoiceItems.filter(item => {
      return item.item_id !== null && item.item_type === 'ROOM';
    });

    _forEach(filteredRooms, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell', fontSize: 9},
        {text: item.quantity, style: 'table-cell', alignment: 'center', fontSize: 9},
        {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right', fontSize: 9},
        {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right', fontSize: 9}
      ]);
    });

    const filteredItemsId = _filter(invoice.InvoiceItems, item => item.item_id !== null && item.item_type !== 'ROOM');
    const groupedItems = _groupBy(filteredItemsId, 'item_id');

    _forEach(groupedItems, items => {
      let row: any;

      _forEach(items, (item, index) => {
        if (index === 0) {
          row = item;
        }
        else {
          row['quantity'] += item.quantity;
          row['total'] += item.total;
        }
      });

      const meta = row.description ? '\n' + row.description : '';

      table_body.push([
        {text: row.name + meta, style: 'table-cell', fontSize: 9},
        {text: row.quantity, style: 'table-cell', alignment: 'center', fontSize: 9},
        {text: this.numberFormat(row.price), style: 'table-cell', alignment: 'right', fontSize: 9},
        {text: this.numberFormat(row.quantity * row.price), style: 'table-cell', alignment: 'right', fontSize: 9}
      ]);
    });

    const filteredItems = _filter(invoice.InvoiceItems, {item_id: null});

    _forEach(filteredItems, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell', fontSize: 9},
        {text: item.quantity, style: 'table-cell', alignment: 'center', fontSize: 9},
        {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right', fontSize: 9},
        {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right', fontSize: 9}
      ]);
    });

    return table_body;
  }

  private buildTableBodyBill(bill, isGrouped?: boolean): Array<any> {
    const total_due = _sumBy(bill.BillItems, item => item.quantity * item.price);
    const table_body = [];
    const total_payment = _sumBy(bill.Payments, 'amount');
    const total_tax = _sumBy(bill.BillItems, (item) => item.quantity * item.tax);
    const balance = total_due + total_tax - total_payment;

    //  Table header
    table_body.push([
      {text: 'EXTRA', style: 'table-header', border: [false, true, false, false]},
      {text: 'QUANTITE', style: 'table-header', border: [false, true, false, false], alignment: 'center'},
      {text: 'PRIX', style: 'table-header', border: [false, true, false, false], alignment: 'right'},
      {text: 'TOTAL', style: 'table-header', border: [false, true, false, false], alignment: 'right'}
    ]);

    //  Table body
    const filteredItems = _filter(bill.BillItems, {item_id: 0});
    const filteredItemsId = _filter(bill.BillItems, item => item.item_id !== 0);

    if (isGrouped) {
      const groupedItems = _groupBy(filteredItemsId, item => item.item_id);

      _forEach(groupedItems, items => {
        let row: any;

        _forEach(items, (item, index) => {
          if (index === 0) {
            row = item;
          }
          else {
            row['quantity'] += item.quantity;
            row['total'] += item.total;
          }
        });

        const meta = row.meta ? '\n' + row.meta : '';

        table_body.push([
          {text: row.name + meta, style: 'table-cell'},
          {text: row.quantity, style: 'table-cell', alignment: 'center'},
          {text: this.numberFormat(row.price), style: 'table-cell', alignment: 'right'},
          {text: this.numberFormat(row.quantity * row.price), style: 'table-cell', alignment: 'right'}
        ]);
      });
    }
    else {
      _forEach(filteredItemsId, item => {
        const meta = item.description ? '\n' + item.description : '';

        table_body.push([
          {text: item.name + meta, style: 'table-cell'},
          {text: item.quantity, style: 'table-cell', alignment: 'center'},
          {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right'},
          {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right'}
        ]);
      });
    }

    _forEach(filteredItems, item => {
      const meta = item.description ? '\n' + item.description : '';

      table_body.push([
        {text: item.name + meta, style: 'table-cell'},
        {text: item.quantity, style: 'table-cell', alignment: 'center'},
        {text: this.numberFormat(item.price), style: 'table-cell', alignment: 'right'},
        {text: this.numberFormat(item.quantity * item.price), style: 'table-cell', alignment: 'right'}
      ]);
    });

    //  Table payment summary
    table_body.push([
      {text: '', colSpan: 2, style: 'table-cell', border: [false, false, false, false]},
      '',
      {
        text: 'Sous Total :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.numberFormat(total_due),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      {text: '', colSpan: 2, style: 'table-cell', border: [false, false, false, false]},
      '',
      {
        text: 'Vignette :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.numberFormat(total_tax),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      {text: '', colSpan: 2, style: 'table-cell', border: [false, false, false, false]},
      '',
      {
        text: 'Payé :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: this.numberFormat(total_payment),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right'
      }
    ]);
    table_body.push([
      {text: '', colSpan: 2, style: 'table-cell', border: [false, false, false, false]},
      '',
      {
        text: 'Total :',
        style: 'table-cell',
        border: [false, false, false, true],
        bold: true
      },
      {
        text: 'Ar ' + this.numberFormat(balance),
        style: 'table-cell',
        border: [false, false, false, true],
        alignment: 'right', bold: true
      }
    ]);

    return table_body;
  }

  private formatCurrency(number, symbol?: string, currency_code?: string) {
    return formatCurrency(number, 'fr-FR', symbol || '', currency_code || DEFAULT_CURRENCY);
  }

  private fgToObject(arrayModel: any[], formValues: Object) {
    const new_values = [];

    for (const key in formValues) {
      if (formValues.hasOwnProperty(key)) {
        _forEach(arrayModel, elem => {
          if (elem.id.toString() === key && formValues[key] === true) {
            new_values.push(elem);
          }
        });
      }
    }

    return new_values;
  }

  private numberFormat(number): string {
    return this.mask.transform(number, 'separator');
  }

  private phoneFormat(phone): string {
    return phone ? this.mask.transform(phone, '000 00 000 00') : '';
  }

  private getStrPhone(phoneNumber: string, separator: string) {
    const split = phoneNumber.split('-');
    let str_phone = '';

    if (split.length > 1) str_phone = [split[0], split[1]].join(separator);
    else str_phone = split[0];

    return str_phone;
  }
}
