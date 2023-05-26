import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import _map from 'lodash.map';
import _filter from 'lodash.filter';
import _forEach from 'lodash.foreach';
import _orderBy from 'lodash.orderby';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

import {AccountService} from 'src/app/accounting/account/account.service';
import {AppService} from 'src/app/app.service';
import {ContactService} from 'src/app/contact/contact.service';
import {InvoiceService} from 'src/app/income/invoice/invoice.service';
import {ItemService} from 'src/app/accounting/item/item.service';
import {MenService} from '../../men.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {PrintService} from 'src/app/_services/print.service';
import {SessionService} from 'src/app/_services/session.service';
import {SharedService} from 'src/app/_services/shared.service';
import {UtilityService} from 'src/app/_services/utility.service';

import Account from 'src/app/models/account';
import Category from 'src/app/models/category';
import Contact from 'src/app/models/contact';
import Invoice from 'src/app/models/invoice';
import Currency from 'src/app/models/currency';
import Facility from 'src/app/models/facility';
import { of, SmartTable } from 'smart-table-ng';
import { SortDirection } from 'smart-table-sort';
import { SearchConfiguration } from 'smart-table-search';
import { SmartTableService } from 'src/app/_services/smart-table.service';

declare var $: any; // JQuery
@Component({
  selector: 'app-men-invoice-detail',
  templateUrl: './men-invoice-detail.component.html',
  styleUrls: ['./men-invoice-detail.component.css'],
  providers: [{
    provide: SmartTable,
    useFactory: () => of([])
  }]
})
export class MenInvoiceDetailComponent implements OnInit, OnDestroy {
  @ViewChild('inputFile') inputFile: ElementRef;

  addPaymentForm: FormGroup;
  historyForm: FormGroup;
  searchStudentForm: FormGroup;
  facility: Facility;
  form: FormGroup;
  invoice: Invoice;
  Currency: Currency;
  subscription = new Subscription();

  accounts: Account[];
  categories: Category[];
  currencies: Currency[];

  schoolGrades = this.menService.grades;

  searchStudent: string;

  ctrl;
  id;
  selectedStudent: any;
  loadingImport: boolean;
  paymentMethods;
  sidePanelOpen: boolean;
  searchItem;
  uploadedStudents: any[];
  submitted;
  submitted_history;
  submitted_payment;
  submitted_student;
  Total = {
    balance: 0,
    discount: 0,
    payment: 0,
    payment_due: 0,
    tax: 0,
    unpaid: 0
  };

  constructor(
    public _table: SmartTable<any>,
    public smartTableService: SmartTableService,
    public appService: AppService,
    public utilityService: UtilityService,
    private accountService: AccountService,
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private invoiceService: InvoiceService,
    private itemService: ItemService,
    private menService: MenService,
    private notification: NotificationService,
    private printService: PrintService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private sharedService: SharedService) {
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.paymentMethods = this.appService.paymentMethods;

    this.initHistoryForm();
    this.initForm();
    this.initPaymentForm();
    this.initTypeahead();

    this.getAccounts();
    this.getInvoice(this.id);

    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        const facility_id = params['facility'];
        this.getFacility(facility_id);
      })
    );

    this.subscription.add(
      this.sharedService.contact$.subscribe((contact: Contact) => {
        if (contact) {
          const student: any = {
            address: contact.address,
            id: contact.id,
            id_cin: contact.id_cin,
            name: contact.name,
            bio_dob: contact.bio_dob,
            grade: contact.meta? contact.meta.school_grade: '',
            meta: Object.assign({}, contact.meta, {insurance_number: this.InvoiceMeta.insurance_number}),
            phone: contact.phone,
            sex: contact.sex
          };
          
          if (this.selectedStudent) {
            const index = this.InvoiceMeta.Students.findIndex(item => item.rank === this.selectedStudent.rank);
            if (index !== -1) {
              student.rank = this.selectedStudent.rank;
              this.InvoiceMeta.Students[index] = student;
              this.updateMeta('UPDATE', true);
            }
            else {
              console.log('no rank');
              this.notification.error(null, 'GENERIC_ERROR');
            }
          }
          else {
            const length = this.InvoiceMeta.Students.length;
            let rank = 1;
            if (length) {
              rank = Number(this.InvoiceMeta.Students[length - 1].rank) + 1;
            }
            student.rank = rank;
            
            this.InvoiceMeta.Students.push(student);
            this.updateMeta('UPDATE', true);
          }

          this.closeStudentModal();
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addItem() {
    const company_id = this.sessionService.getCompanyId();

    const fg = this.formBuilder.group({
      company_id: company_id,
      description: null,
      id: null,
      item_id: [null, Validators.required],
      item_type: 'GOODS',
      invoice_id: this.id,
      name: ['', Validators.required],
      quantity: [1, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      total: 0,
      sku: '',
      meta: null,
      state: 'NEW'
    });

    this.InvoiceItems.push(fg);
  }

  addPayment() {
    this.submitted_payment = true;

    if (this.addPaymentForm.valid) {
      const formValue = this.addPaymentForm.getRawValue();
      const payment = Object.assign({}, formValue, {
        invoice_id: this.invoice.id,
        payment_method: formValue.payment_method.code,
        account_id: formValue.account.id,
        category_id: this.invoice.category_id,
        contact_name: this.invoice.contact_name,
        currency_code: 'MGA',
        currency_rate: 1,
        type: 'INVOICE_PAYMENT'
      });

      this.invoiceService.createPayment(payment)
        .toPromise()
        .then(res => {
          this.close();
          this.resetForm();
          this.notification.success(null, 'SAVE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  cancel() {
    this.invoiceService.cancel(this.invoice)
      .toPromise()
      .then(res => {
        this.resetForm();
        this.notification.info(null, 'INVOICE_CANCELED');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  close() {
    this.sidePanelOpen = false;
    this.submitted_payment = false;
  }

  closeStudentModal() {
    $('#modal-student').modal('hide');
    this.submitted_student = false;
    this.selectedStudent = null;
    this.searchStudentForm.reset();
  }

  displayItems(item) {
    let description = '';

    if (item.status_code === 'CHECKIN' || item.status_code === 'CHECKOUT') {
      description = moment(item.description).format('DD MMM YYYY HH:mm');
    }
    else if (item.status_code === 'ADD' || item.status_code === 'REMOVE' || item.status_code === 'REMOVED') {
      const items = JSON.parse(item.description);

      for (let i = 0; i < items.length; i++) {
        description += items[i].name + ' (' + items[i].quantity + ')';

        if (items.length > 1 && (i + 1) < items.length) {
          description += ' - ';
        }
      }
    }
    else {
      description = item.description;
    }

    return description;
  }

  handleFile(evt) {
    const ctrl = this;
    const files = evt.target.files, f = files[0];
    const reader = new FileReader();

    ctrl.loadingImport = true;

    reader.onload = function(e) {
      ctrl.loadingImport = false;

      const workbook = XLSX.read(reader.result, {type: 'array', raw: true, cellFormula: false});
      const wsname = workbook.SheetNames[0];
      const result = XLSX.utils.sheet_to_json(workbook.Sheets[wsname], {
        header: 1,
        raw: false,
        range: 1,
        defval: null,
        blankrows: false
      });
      ctrl.uploadedStudents = result;

      if (!ctrl.uploadedStudents.length) ctrl.notification.error(null, 'NO_MATCH');
    };
    reader.readAsArrayBuffer(f);
  }

  getAge(str_dob) {
    const dob = moment(str_dob, 'YYYY-MM-DD').format();
    const age = this.utilityService.getAge(dob);
    return !isNaN(age)? age: '-';
  }

  // Return total per item
  getTotal(formGroup: FormGroup) {
    const total = formGroup.controls.quantity.value * formGroup.controls.price.value;

    formGroup.patchValue({total: total});

    return total;
  }

  // Test if an item is a room and make the field readonly
  isRoom = (item) => item.controls['item_type'].value === 'ROOM';
  isNew = (item) => item.controls['state'] ? false : true;

  linkContactToStudent() {
    this.submitted_student = true;
    if (this.searchStudentForm.valid) {
      let { student } = this.searchStudentForm.getRawValue();

      if (this.selectedStudent) {
        student = {
          ...student,
          ...this.selectedStudent,
          id: student.id,
          meta: {
            ...student.meta,
            school_grade: this.getGrade(this.selectedStudent.grade)
          }
        };
        this.contactService.update(student).toPromise().then(contact => {
          const index = this.InvoiceMeta.Students.findIndex(item => item.rank === this.selectedStudent.rank);
          if (index !== -1) {
            this.InvoiceMeta.Students[index] = student;
            this.updateMeta('UPDATE', true);
            this.closeStudentModal();
          }
          else {
            console.log('no rank');
            this.notification.error(null, 'GENERIC_ERROR');
          }
        }).catch(err => this.notification.error(null, err.error));
      }
      else {
        this.contactService.get(student.id).toPromise().then(contact => {
          const length = this.InvoiceMeta.Students.length;
          let rank = 1;

          student = {
            id: contact.id,
            name: contact.name,
            sex: contact.sex,
            bio_dob: contact.bio_dob,
            grade: contact.meta? contact.meta.school_grade: null,
            meta: {
              ...contact.meta
            }
          };

          if (length) {
            rank = Number(this.InvoiceMeta.Students[length - 1].rank) + 1;
          }
          student.rank = rank;

          this.InvoiceMeta.Students.push(student);
          this.updateMeta('UPDATE', true);
          this.closeStudentModal();
        }).catch(err => {
          console.log(err);
          this.notification.error(null, err.error)
        });
      }
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  onSelectItem(event, group) {
    event.preventDefault();

    group.patchValue({
      item_id: event.item.id,
      item_type: event.item.type,
      name: event.item.name,
      sku: event.item.sku,
      price: event.item.sale_price
    });
  }

  open() {
    this.addPaymentForm.reset({
      account: this.accounts[0],
      paid_at: new Date(),
      amount: this.Total.balance,
      payment_method: this.paymentMethods.find(item => item.code === 'CASH')
    });
    this.sidePanelOpen = true;
  }

  openSidePanelContact(student): void {
    this.selectedStudent = student;
    this.sharedService.updateSidePanel(true);
    this.sharedService.newContact(student? {...student,
      bio_dob: new Date(student.bio_dob),
      meta: {
        contact_type: 'STUDENT',
        school_grade: this.getGrade(student.grade)
      }
    }: {meta: {contact_type: 'STUDENT'}});
  }

  openStudentModal(student: any) {
    this.selectedStudent = {
      ...student,
      bio_dob: new Date(student.bio_dob),
      meta: {
        contact_type: 'STUDENT',
        school_grade: this.getGrade(student.grade)
      }
    };
  }

  print(type) {
    this.invoice.Facility = this.facility;

    if (type === 'A4') {
      this.invoiceService.invoicePrint(this.invoice.id)
        .then(res => this.printService.invoicePascoma(this.invoice))
        .catch(err => this.notification.error(null, err.error));
    }
    else if (type === 'ACTE') {
      this.invoiceService.invoicePrint(this.invoice.id)
        .then(res => this.printService.actOfAccession(this.invoice))
        .catch(err => this.notification.error(null, err.error));
    }
    else if (type === 'RECEIPT') {
      if (this.invoice.status !== 'PAID') {
        this.notification.error(null, 'INVOICE_NOT_PAID');
      }
      else {
        this.invoiceService.invoicePrint(this.invoice.id)
          .then(res => this.printService.receipt(this.invoice))
          .catch(err => this.notification.error(null, err.error));
      }
    }
  }

  removeItem(index, group) {
    if (group.get('item_type').value !== 'ROOM') {
      this.InvoiceItems.removeAt(index);
    }
    else {
      this.notification.error(null, 'DELETE_ERROR');
    }
  }

  save() {
    this.submitted = true;

    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const invoice = new Invoice(Object.assign({}, formValue, {
        id: this.invoice.id,
        category_id: this.invoice.category_id,
        invoiced_at: this.invoice.invoiced_at,
        meta: {
          ...this.invoice.meta,
          school_year: formValue.school_year
        },
        amount: this.Total.payment_due + this.Total.tax
      }));

      delete invoice['school_year'];

      this.invoiceService.update(invoice)
        .toPromise()
        .then(res => {
          this.resetForm();
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => {
          this.notification.error(null, err.error);
        });
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  sendEmail() {
    this.invoiceService.invoiceMail(this.invoice.id)
      .then(res => {
        this.notification.info(null, 'EMAIL_SENT');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  updateContact(student:any) {
    this.contactService.find(student.name)
      .toPromise()
      .then(res => {
        if (res) {
          this.router.navigate(['/men/claim/register'], {queryParams: {
            facility: this.facility.id,
            contact: res.id
          }});
        }
        else {
          this.contactService.create({
            name: student.name,
            sex: student.sex,
            bio_dob: student.bio_dob
          })
          .toPromise()
          .then(response => {

            this.notification.success(null, 'SAVE_SUCCESS');
          })
          .catch(err => this.notification.error(null, err.error));
        }
      })
      .catch(err => this.notification.error(null, err.error));
  }

  updateMeta(type, skipReset?: boolean, input?: HTMLInputElement) {
    let body = null;

    if (type === 'INSERT') {
      const mapped = this.uploadedStudents.map(item => {
        const dob = moment(item[2], 'M/D/YY');
        return {
          id: +item[7] || null,
          rank: +item[0],
          name: item[1],
          sex: item[5] === 'G' || 'M' ? 'M' : 'F',
          bio_dob: dob.format(),
          grade: item[3],
          insurance: item[4]
        };
      });
      const meta = Object.assign({}, this.InvoiceMeta, {
        Students: JSON.stringify(mapped)
      });

      body = this.uploadedStudents && this.uploadedStudents.length ? {meta} : null;
    }
    else {
      let Students = '[]';
      if (this.InvoiceMeta && this.InvoiceMeta.Students) {
        Students = JSON.stringify(this.InvoiceMeta.Students);
      }
      body = {
        meta: Object.assign({}, this.InvoiceMeta, {
          Students
        })
      };
    }

    if (body) {
      this.invoiceService.updateMeta(this.invoice.id, body)
        .then(res=> {
          if (!skipReset) {
            this.resetForm();
          }
          else {
            this.reloadStudentTable(true);
          }

          if (input) {
            input.value = null;
            if(input.value){
              input.type = "text";
              input.type = "file";
            }
          }
          this.notification.success(null, 'UPDATE_SUCCESS');
        })
        .catch(err => this.notification.error(null, err.error));
    }
    else this.notification.error(null, 'EMPTY_LIST');
  }

  updateStatus(status) {
    this.invoiceService.updateStatus(this.invoice, {status: status})
      .toPromise()
      .then(res => {
        this.resetForm();
        this.notification.success(null, 'UPDATE_SUCCESS');
      })
      .catch(err => this.notification.error(null, err.error));
  }

  get InvoiceItems(): FormArray {
    return this.form.get('InvoiceItems') as FormArray;
  }

  get InvoiceMeta(): any {
    return this.invoice ? this.invoice.meta : {};
  }

  set InvoiceMeta(meta) {
    this.invoice.meta = meta;
  }

  private arrayToForm(invoiceItems) {
    while (this.InvoiceItems.length) {
      this.InvoiceItems.removeAt(0);
    }
    
    _forEach(invoiceItems, (item) => {
      this.InvoiceItems.push(
        this.formBuilder.group(
          Object.assign(
            {},
            item
          )
        )
      );
    });
  }

  private getAccounts() {
    this.accountService.list()
      .toPromise()
      .then(res => {
        this.accounts = res.filter(item => item.id === 1);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getFacility(id) {
    if (id) {
      this.menService.get(id)
        .then(res => this.facility = res)
        .catch(err => this.notification.error(null, err.error));
    }
  }

  private getGrade(grade: string) {
    if (!grade) return null;
    for (let schoolGrade of this.schoolGrades) {
      const text = (schoolGrade.label + ', ' + schoolGrade.keyword).toLowerCase();
      if (text.includes(grade.toLowerCase())) {
        return schoolGrade.label;
      }
    }

    return undefined;
  }

  private getInvoice(id) {
    this.invoiceService.get(id)
      .toPromise()
      .then(invoice => {
        this.invoice = invoice;
        this.invoice.meta = Object.assign({}, invoice.meta, {
          Students: invoice.meta && invoice.meta.Students ? JSON.parse(invoice.meta.Students) : []
        });
        this.invoice.Revenues = _orderBy(invoice.Revenues, ['id'], ['desc']);
        this.Total.payment = this.invoiceService.getTotalPayment(this.invoice);
        this.Total.payment_due = this.invoiceService.getPaymentDue(this.invoice.InvoiceItems);
        this.Total.balance = this.Total.payment_due - this.Total.payment;

        this.reloadStudentTable();

        setTimeout(() => {
          this.form.patchValue(Object.assign({}, invoice, {
            contact_name: invoice.Contact ? invoice.Contact.name : '',
            school_year: invoice.meta? invoice.meta.school_year: ''
          }));
          this.arrayToForm(invoice.InvoiceItems);
        }, 800);
      })
      .catch(err => {
        console.log(err);
        this.notification.error(null, err.error);
      });
  }

  private initHistoryForm() {
    this.historyForm = this.formBuilder.group({
      description: [null, Validators.required]
    });
  }

  private initForm() {
    this.submitted = false;
    this.form = this.formBuilder.group({
      invoice_number: [null, Validators.required],
      contact_id: null,
      contact_name: null,
      facility_id: null,
      notes: null,
      school_year: null,
      InvoiceItems: this.formBuilder.array([])
    });

    this.searchStudentForm = this.formBuilder.group({
      student: [null, Validators.required]
    })
  }

  private initPaymentForm() {
    this.addPaymentForm = this.formBuilder.group({
      description: null,
      paid_at: [null, Validators.required],
      amount: [null, Validators.required],
      account: [null, Validators.required],
      payment_method: [null, Validators.required]
    });
  }

  private initTypeahead() {
    this.searchItem = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => term.length < 3 ? [] : this.itemService.select(term))
      );
  }

  private reloadStudentTable(usePreviousTS?: boolean) {
    this._table.use(this.InvoiceMeta.Students, !usePreviousTS? {
      filter: {},
      search: this.searchStudent? {
        escape: false,
        flags: 'i',
        scope: ['name'],
        value: this.searchStudent
      } as SearchConfiguration: {},
      sort: {
        pointer: 'rank',
        direction: SortDirection.ASC
      },
      slice: {
        page: 1,
        size: 50
      }
    }: undefined);
  }

  resetForm() {
    this.invoice = null;
    this.submitted_history = false;
    this.selectedStudent = null;
    this.uploadedStudents = [];
    this.historyForm.reset();

    this.initForm();
    this.getInvoice(this.id);
  }
}
