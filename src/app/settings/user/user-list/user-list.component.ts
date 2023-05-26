import {Component, OnInit} from '@angular/core';

import {UserService} from '../user.service';

import _orderBy from 'lodash.orderby';
import {SmartTable, of} from 'smart-table-ng';
import server from 'smart-table-server';
import {AppService} from 'src/app/app.service';
import {SmartTableService} from 'src/app/_services/smart-table.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  providers: [{
    provide: SmartTable,
    useFactory: (userService: UserService) => of(
      [],
      userService.getConfig(),
      server({
        query: (tableState) => userService.paginate(tableState)
      })
    ),
    deps: [UserService]
  }]
})
export class UserListComponent implements OnInit {

  constructor(public _table: SmartTable<any>,
              public appService: AppService,
              public smartTableService: SmartTableService) {
    }

  ngOnInit() {}
}
