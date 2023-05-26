import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';

import * as moment from 'moment';

import {FullCalendarComponent} from '@fullcalendar/angular';
import {EventInput} from '@fullcalendar/core/structs/event';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGrigPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {MaintenanceService} from '../maintenance.service';
import {NotificationService} from '../../_services/notification.service';
import {Router} from '@angular/router';

const CACHE_CALENDAR = 'C_CALENDAR';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent: FullCalendarComponent;

  addCustomerForm: FormGroup;
  activeEvent;
  activeView;
  calendarVisible = true;
  calendarPlugins = [dayGridPlugin, timeGrigPlugin, interactionPlugin];
  calendarEvents: EventInput[] = [];
  defaultDate;
  sidePanelOpen = false;
  submitted: Boolean = false;

  constructor(protected maintenanceService: MaintenanceService,
              private notification: NotificationService,
              private router: Router) {
  }

  ngOnInit() {
    this.defaultDate = sessionStorage.getItem(CACHE_CALENDAR);
  }

  formatEvent = (ev): void => {
    const timeContent = ev.el.querySelector('.fc-time');
    const titleContent = ev.el.querySelector('.fc-title');

    // Append user's first name to event time
    if (ev.event.extendedProps.Staff) {
      const userEl = document.createElement('span');
      const user = (ev.event.extendedProps.Staff) ? ` / ${ev.event.extendedProps.Staff}` : '';
      userEl.innerHTML = `${user}`;
      timeContent ? timeContent.append(userEl) : titleContent.append(userEl);
    }
  };

  getEvents(argView) {
    this.maintenanceService.getEvents({
      start: moment(argView.view.activeStart).format('YYYY-MM-DD'),
      end: moment(argView.view.activeEnd).format('YYYY-MM-DD')
    })
      .toPromise()
      .then(res => {
        this.activeView = argView.view;
        this.calendarEvents = res;

        sessionStorage.setItem(CACHE_CALENDAR, moment(argView.view.activeStart).format('YYYY-MM-DD'));
      })
      .catch(err => {
        this.notification.error(null, err.message);
      });
  }

  handleEventClick(ev) {
    this.router.navigate(['/maintenance/detail/', ev.event.extendedProps.request_id]);
  }

  handleDateSelect = (date) => {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.gotoDate(date.year + '-' + date.month + '-' + date.day);
  };
}
