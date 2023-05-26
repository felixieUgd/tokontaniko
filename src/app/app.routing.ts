import {Routes} from '@angular/router';

// Layouts
import {CommonLayoutComponent} from './common/common-layout.component';
import {AuthenticationLayoutComponent} from './common/authentication-layout.component';

export const AppRoutes: Routes = [
  {
    path: '',
    redirectTo: 'authentication',
    pathMatch: 'full',
  },
  {
    path: 'authentication',
    component: AuthenticationLayoutComponent,
    loadChildren: './authentication/authentication.module#AuthenticationModule'
  },
  {
    path: '',
    component: CommonLayoutComponent,
    children: [
      {
        path: 'accounting',
        loadChildren: './accounting/accounting.module#AccountingModule'
      },
      {
        path: 'men',
        loadChildren: './men/men.module#MENModule'
      },
      {
        path: 'health',
        loadChildren: './health/health.module#HealthModule'
      },
      {
        path: 'contact',
        loadChildren: './contact/contact.module#ContactModule'
      },
      {
        path: 'dashboard',
        loadChildren: './dashboard/dashboard.module#DashboardModule'
      },
      {
        path: 'inventory',
        loadChildren: './inventory/inventory.module#InventoryModule'
      },
      {
        path: 'expense',
        loadChildren: './expense/expense.module#ExpenseModule'
      },
      {
        path: 'income',
        loadChildren: './income/income.module#IncomeModule'
      },
      {
        path: 'maintenance',
        loadChildren: './maintenance/maintenance.module#MaintenanceModule'
      },
      {
        path: 'settings',
        loadChildren: './settings/settings.module#SettingsModule'
      }
    ]
  }
];

