import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { concat, Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MenService } from 'src/app/men/men.service';
import Facility from 'src/app/models/facility';
import Geography from 'src/app/models/geograhy';
import { NotificationService } from 'src/app/_services/notification.service';
import * as moment from 'moment';
import { TableState } from 'smart-table-ng';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-search-geography-facility',
  templateUrl: './search-geography-facility.component.html',
  styleUrls: ['./search-geography-facility.component.css']
})
export class SearchGeographyFacilityComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<any>();
  facilityInput$ = new Subject<string>();

  isFacilityLoading: boolean = false;

  regions: Geography[];
  districts: Geography[];
  communes: Geography[];

  submitted: boolean;

  regionsDisplay: Geography[];
  districtsDisplay: Geography[];
  communesDisplay: Geography[];

  subscription = new Subscription();

  searchForm: FormGroup;

  searchFacility$: Observable<any>;

  constructor(private menService: MenService,
              private formBuilder: FormBuilder,
              private notification: NotificationService
  ) { 
  }

  ngOnInit() {
    this.loadGeographies();
    this.initForm();
    this.initSearch();
    const regionControl = this.searchForm.get('region_id');
    const districtControl = this.searchForm.get('district_id');
    const communeControl = this.searchForm.get('commune_id');
    const facilityControl = this.searchForm.get('Facility');

    this.subscription.add(
      regionControl.valueChanges.subscribe(id => {
        if (this.districts) {
          this.districtsDisplay = this.districts.filter(district => district.parent_id === id);
        }
        this.setValidity(districtControl, !!id);
        this.setValidity(communeControl, !!id);
        this.setValidity(facilityControl, !!id);

        districtControl.setValue(null);
      })
    );

    this.subscription.add(
      districtControl.valueChanges.subscribe(id => {
        if (this.communes) {
          this.communesDisplay = this.communes.filter(commune => commune.parent_id === id);
        }

        communeControl.setValue(null);
      })
    );

    this.subscription.add(
      communeControl.valueChanges.subscribe(id => {
        this.initSearch();
        facilityControl.setValue(null);
      })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setValidity(control: AbstractControl, isRequired?: boolean) {
    control.setValidators(isRequired? [Validators.required]: null);
    control.updateValueAndValidity();
    this.submitted = false;
  }

  onSubmit() {
    this.submitted = true;
    if (this.searchForm.valid) {
      this.search.next(this.searchForm.getRawValue());
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      Facility: null,
      commune_id: null,
      district_id: null,
      region_id: null,
      start: moment().startOf('month').startOf('day').toDate(),
      end: moment().endOf('month').endOf('day').toDate()
    });
  }

  private initSearch() {
    this.searchFacility$ = concat(
      of([]),
      this.facilityInput$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.length <= 3)
            return [];

          const commune = this.searchForm.get('commune_id').value;
          const ts: TableState = {
            sort: {},
            slice: {
              page: 1,
              size: 10
            },
            filter: {
              geography_id: commune? [
                {
                  operator: "equals",
                  type: "number",
                  value: commune
                }
              ]: undefined
            },
            search: {
              scope: ['name'],
              value: term
            }
          }
          this.isFacilityLoading = true;
          return this.menService.paginateByUserGeography(ts, 'TS_HEALTH_REPORT')
            .then(res => {
              return res && res.data.length > 0 ? res.data : [];
            })
            .catch(err => {
              this.notification.error(null, err.error);
            }).finally(() => {
              this.isFacilityLoading = false;
            })
        })
      )
    );
  }

  private loadGeographies() {
    this.menService.getGeographies('RGN').then(rgn => {
      this.regions = rgn;
    
      return this.menService.getGeographies('DST').then(dst => {
        this.districts = dst;

        return this.menService.getGeographies('CMN').then(cmn => {
          this.communes = cmn;
          
          this.regionsDisplay = this.regions;
        })
      });
    }).catch(err => this.notification.error(null, err.error))
  }

}
