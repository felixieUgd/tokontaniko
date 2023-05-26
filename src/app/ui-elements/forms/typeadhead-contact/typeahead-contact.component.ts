import {Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {ContactService} from 'src/app/contact/contact.service';
import Contact from 'src/app/models/contact';
import {NotificationService} from 'src/app/_services/notification.service';
import {SharedService} from 'src/app/_services/shared.service';

@Component({
  selector: 'app-typeahead-contact',
  templateUrl: './typeahead-contact.component.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TypeaheadContactComponent
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: TypeaheadContactComponent
    }
  ]
})
export class TypeaheadContactComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy, Validators {
  //  Inform the parent form that value changed
  onChange: any = () => {};
  //  Inform the parent form that child form touched
  onTouched: any = () => {};

  @Input() readOnly: Boolean;
  @Input() submitted: Boolean;
  @Input() inputClass: String;
  @Input() searchObject: Partial<Contact> = null;
  @Output() selectContact = new EventEmitter<Contact>();
  @Output() removeContact = new EventEmitter<Contact>();

  @ViewChild('inputElt') inputRef: ElementRef<HTMLInputElement>;

  subscription: Subscription;

  disabled = false;
  display = null;
  search = null;
  loading = false;
  touched = false;
  value = null;

  constructor(
    private contactService: ContactService,
    private notification: NotificationService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.searchObject !== undefined && this.inputRef) {
      this.inputRef.nativeElement.value = this.searchObject ? this.searchObject.name : null;

      const event = new Event('input', {
        bubbles: true,
        cancelable: true
      });
      this.inputRef.nativeElement.dispatchEvent(event);
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  //  ControlValueAccessor
  writeValue(obj: any): void {
    // console.log('writeValue', obj);
    if (obj) {
      this.value = obj;
      this.display = obj.name;
    }
    else {
      this.clear();
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.submitted && (!this.value || !Object.keys(this.value).length) ? {isRequired: true} : null;
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  onSelectContact = (event): void => {
    this.markAsTouched();
    event.preventDefault();

    if (event.item) {
      this.value = event.item;
      this.display = this.value.name;
      this.selectContact.emit(event.item);
      this.onChange(event.item);
    }
    else {
      this.sharedService.updateSidePanel(true);
      this.sharedService.newContact(this.searchObject);

      //  Subscribe to new created contact
      if (!this.subscription && !this.touched) {
        this.subscription = this.sharedService.contact$.subscribe(value => {
          if (value) {
            this.value = value;
            this.display = this.value.name;
            this.selectContact.emit(event.item);
            this.onChange(value);
          }
        });
      }
    }
  }

  clear() {
    this.removeContact.emit(this.value);
    this.display = null;
    this.search = null;
    this.value = null;
    this.onChange(null);
  }

  searchContact = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) return [];
        else {
          this.loading = true;

          return this.contactService.select(term)
            .toPromise()
            .then(res => {
              return res.length > 0 ? res : [null];
            })
            .catch(err => this.notification.error(null, err.error))
            .finally(() => this.loading = false);
        }
      })
    )
}
