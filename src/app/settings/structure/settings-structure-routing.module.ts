import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {SettingsStructureFacilityComponent} from './facility/settings-structure-facility.component';
import {SettingsStructureFacilityTypeComponent} from './facility/type/settings-structure-facility-type.component';
import {SettingsStructureRoomComponent} from './room/settings-structure-room.component';
import {SettingsStructureRoomTypeComponent} from './room/type/settings-structure-room-type.component';
import {SettingsStructureStorageComponent} from './storage/settings-structure-storage.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'facility'
  },
  {
    path: 'facility',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
      },
      {
        path: 'list',
        component: SettingsStructureFacilityComponent
      },
      {
        path: 'type',
        component: SettingsStructureFacilityTypeComponent
      }
    ]
  },
  {
    path: 'room',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
      },
      {
        path: 'list',
        component: SettingsStructureRoomComponent
      },
      {
        path: 'type',
        component: SettingsStructureRoomTypeComponent
      }
    ]
  },
{
  path: 'storage',
  children: [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'list'
    },
    {
      path: 'list',
      component: SettingsStructureStorageComponent
    },
  ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsStructureRoutingModule { }
