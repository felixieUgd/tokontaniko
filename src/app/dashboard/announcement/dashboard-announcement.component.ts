import {Component, OnInit} from '@angular/core';

import * as moment from 'moment';
import _orderBy from 'lodash.orderby';

import {DashboardService} from '../dashboard.service';
import {NotificationService} from 'src/app/_services/notification.service';
import {SessionService} from 'src/app/_services/session.service';
import {Router} from '@angular/router';
import Announcement from 'src/app/models/announcement';

declare var $: any;

@Component({
  selector: 'app-dashboard-announcement',
  templateUrl: './dashboard-announcement.component.html',
  styleUrls: ['./dashboard-announcement.component.css']
})
export class DashboardAnnouncementComponent implements OnInit {
  active_menu: string;
  announcements: Announcement[];
  read: Announcement[];
  selected: Announcement;
  unread: Announcement[];
  searchKeyword = '';

  constructor(
    private dashboardService: DashboardService,
    private notification: NotificationService,
    private router: Router,
    private sessionService: SessionService) {
  }

  ngOnInit() {
    this.getNewFeeds();
  }

  display(data, menu) {
    this.announcements = data;
    this.selected = null;
    this.active_menu = menu;
  }

  edit(announcement) {
    if (this.sessionService.getUser().id === announcement.user_id) {
      this.router.navigate(['/dashboard/announcement/detail', announcement.id]);
    }
    else {
      this.notification.error(null, 'PERMISSION_DENIED');
    }
  }

  filterInbox(announcements: Announcement[]): Announcement[] {
    return announcements ? announcements.filter(item => {
      let index = item.title.toLowerCase().indexOf(this.searchKeyword.toLowerCase());

      if (index === -1) {
        index = item.content.toLowerCase().indexOf(this.searchKeyword.toLowerCase());
      }

      return index !== -1;
    }) : [];
  }

  hasPermission(announcement) {
    const index = announcement.permissions.findIndex(
      item => item.id === this.sessionService.getUser().Roles[0]
    );

    return index >= 0;
  }

  hasSigned(announcement) {
    const index = announcement.signatures.findIndex(
      item => item.user_id === this.sessionService.getUser().id
    );

    return index >= 0;
  }

  formatBody = function (body) {
    return body.replace(/<(?:.|\n)*?>/gm, '');
  }

  fromNow(date) {
    return date ? moment(date).fromNow() : moment().subtract(1, 'day').fromNow();
  }

  getNewFeeds() {
    this.dashboardService.getNewFeeds()
      .then(res => {
        const data = _orderBy(res, ['created_at'], ['desc'])
          .map(item => {
            return Object.assign(
              {},
              item,
              {
                content_text: $(item.content).text(),
                has_permission: this.hasPermission(item),
                has_been_signed: this.hasSigned(item)
              }
            );
          })
          .filter(item => item.has_permission);

        this.unread = data.filter(item => !item.has_been_signed);
        this.read = data.filter(item => item.has_been_signed);

        this.display(this.unread, 'UNREAD');
      })
      .catch(err => {
        this.notification.error(null, err.error)
      });
  }

  onSelectFeed(feed) {
    this.selected = feed;

    if (!feed.has_been_signed) {
      const body = {
        user_id: this.sessionService.getUser().id,
        user_name: this.sessionService.getUser().name,
        created_at: moment().format(),
        photo: this.sessionService.getUser().photo
      };

      this.dashboardService.signAnnouncement(feed.id, body)
        .then(res => { })
        .catch(err => this.notification.error(null, err.error));
    }
  }
}
