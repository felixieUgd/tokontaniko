import {Component, OnInit} from '@angular/core';
import {FormGroup, Validators, FormBuilder, FormControl, FormArray} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import _forEach from 'lodash.foreach';
import _map from 'lodash.map';

import Permission from 'src/app/models/permission';
import Role from 'src/app/models/role';

import {RoleService} from '../role.service';
import {NotificationService} from 'src/app/_services/notification.service';
import { ExportService } from 'src/app/_services/export.service';
import User from 'src/app/models/user';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html'
})
export class RoleEditComponent implements OnInit {
  addForm: FormGroup;
  role: Role;
  users: User[];
  roleForm: FormGroup;
  permissions: Permission[];

  savedMenu: any;

  id;
  menus: any;
  Selected: any;
  selected_menu: any;
  submitted: boolean;
  submitted_add: boolean;

  constructor(private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private exportService: ExportService,
    private roleService: RoleService,
    private notification: NotificationService) {}

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');

    this.initForm();
    this.initAddForm();
    this.getRole(this.id);
    this.getUsers(this.id);
  }

  addAll() {
    this.role.Permissions = this.permissions.concat(this.role.Permissions);
    this.permissions.length = 0;
  }

  addMenu() {
    this.Children.push(
      this.formBuilder.group({
        title: null,
        enabled: true,
        isNew: [true, Validators.required]
      })
    )
  }

  addRemove() {
    if (this.Selected.type === 'ADD') {
      const index = this.permissions.findIndex(item => item.id === this.Selected.value.id);

      this.permissions.splice(index, 1);
      this.role.Permissions.push(this.Selected.value);
    }
    else {
      const index = this.role.Permissions.findIndex(item => item.id === this.Selected.value.id);

      this.role.Permissions.splice(index, 1);
      this.permissions.push(this.Selected.value);
    }

    this.Selected = null;
  }

  clearAll() {
    this.permissions = this.permissions.concat(this.role.Permissions);
    this.role.Permissions.length = 0;
  }

  clearMenu() {
    this.selected_menu = null;
    this.initAddForm();
  }

  edit(parent:any, menu: any, path: string) {

    this.selected_menu = Object.assign({}, menu, {path});

    this.initAddForm();

    this.addForm.patchValue({parent: menu.key});

    if (this.hasChild(menu.value)) {
      _map(parent[menu.key], (value, key) => {
        if (!this.hasChild(value)) {
          this.Children.push(
            this.formBuilder.group({
              title: key,
              enabled: parent[menu.key][key],
              isNew: false
            })
          )
        }
      });
    }
  }

  exportMenuJSON() {
    this.reverseMap(this.menus);
    this.exportService.exportToJson(this.menus, 'menu_' + this.role.name.replace(/\s/g, ''));
  }

  filterPermission(data, keyword) {
    return data ? data.filter(item => item.display_name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) : [];
  }

  hasChild(item: any): boolean {
    return Object.keys(item).length > 0;
  }

  importMenuJSON(event: any) {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = () => {
      try {
        const menu = JSON.parse(fileReader.result.toString());
        const tmp = this.getMenuTree(menu);
        if (tmp) {
          this.menus = tmp;
          this.clearMenu();
          this.notification.success(null, 'IMPORT_SUCCESS')
        }
        else {
          this.notification.error(null, 'INVALID_FILE');
        }
      }
      catch(err) {
        console.log(err);
        this.notification.error(null, 'INVALID_FILE');
      }
    }
    fileReader.onerror = (error) => {
      console.log(error);
      this.notification.error(null, 'IMPORT_ERROR');
    }
  }

  onSelect(item, type) {
    this.Selected = {
      type,
      value: item
    };
  }

  removeMenu(index?) {
    this.Children.removeAt(index);
  }

  removeParentMenu() {
    if (this.selected_menu) {
      const split = this.selected_menu.path.split('.');

      if (split.length > 1) {
        delete this.menus[split[0]][split[1]];
      }
      else {
        delete this.menus[split[0]];
      }

      this.initAddForm();
    }
    else {
      this.notification.error(null, 'NO_ELEMENT_SELECTED');
    }
  }

  resetMenu() {
    this.menus = this.getMenuTree(this.savedMenu);
  }

  save() {
    this.submitted = true;

    if (this.roleForm.valid) {
      const formValue = this.roleForm.getRawValue();
      const role = new Role({
        id: this.role.id,
        name: formValue.name,
        display_name: formValue.display_name,
        default_route: formValue.default_route,
        description: formValue.description,
        Permissions: this.role.Permissions
      });

      this.roleService.update(role)
        .toPromise()
        .then(res => {
          this.reset();
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

  stringify(object) {
    return JSON.stringify(object);
  }

  updateMenu() {
    if (this.roleForm.valid) {
      this.reverseMap(this.menus);

      const body = {
        activated_menus: this.menus
      }

      this.roleService.updateMenu(this.role.id, body)
        .then(res => {
          this.router.navigate(['/settings/role']);
          this.savedMenu = {...this.menus};
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

  validate() {
    this.submitted_add = true;

    const formValue = this.addForm.getRawValue();

    if (this.addForm.valid && formValue.Children.length > 0) {
      const newMenu: any = {};

      _map(formValue.Children, item => {
        newMenu[item.title] = item.enabled ? 1 : 0;
      });

      if (this.selected_menu) { //  IF EDIT

        const childrenKey: any[] = Object.keys(this.selected_menu.value);
        childrenKey.forEach(key => {
          const child = this.selected_menu.value[key];
          if (this.hasChild(child)) {
            newMenu[key] = child;
          }
        });

        const splits = this.selected_menu.path.split('.') as Array<string>;
        let prop = splits[splits.length - 1];
        let ref = this.menus;

        splits.forEach((split, index) => {
          if (index < splits.length - 1) {
            ref = ref[split];
          }
        });

        if (prop) {
          ref[prop] = newMenu;
        }
      }
      else {  //  IF NEW
        this.menus[formValue.parent] = newMenu;
      }

      this.initAddForm();
    }
    else {
      this.notification.error(null, 'FORM_NOT_VALID');
    }
  }

  get Children(): FormArray {
    return this.addForm.get('Children') as FormArray;
  }

  private getMenuTree(menu: any) {
    const tmp = JSON.parse(JSON.stringify(menu));
    this.mapObject(tmp);
    return tmp;
  }

  private initForm() {
    this.submitted = false;

    this.roleForm = this.formBuilder.group({
      id: null,
      name: ['', Validators.required],
      display_name: ['', Validators.required],
      default_route: [null, Validators.required],
      description: '',
      available: '',
      selected: ''
    });
  }

  private initAddForm() {
    this.submitted_add = false;

    this.addForm = this.formBuilder.group({
      parent: null,
      Children: this.formBuilder.array([])
    });
  }

  private getRole(id) {
    this.roleService.get(id)
      .toPromise()
      .then(res => {
        this.role = new Role(res[0]);
        this.permissions = res[1];
        this.roleForm.patchValue({
          name: this.role.name,
          display_name: this.role.display_name,
          default_route: this.role.default_route,
          description: this.role.description
        });

        this.role.Permissions = res[0].Permissions.map(elem => {
          const index = this.permissions.findIndex(item => item.id === elem.id);

          if (index !== -1) {
            const value = this.permissions[index];

            this.permissions.splice(index, 1);

            return value;
          }

          return elem;
        });

        this.savedMenu = res[0].activated_menus;

        //  Build checkbox tree
        this.menus = this.getMenuTree(this.savedMenu);
      })
      .catch(err => this.notification.error(null, err.error));
  }

  private getUsers(id) {
    this.roleService.getWithUsers(id).toPromise().then(role => {
      this.users = role.Users;
    }).catch(err => this.notification.error(null, err.error));
  }

  //  Map integer 0 or 1 to boolean
  private mapObject(data: any): void {
    _map(data, (value, key) => {
      if (this.hasChild(value)) {
        this.mapObject(value);
      }
      else {
        data[key] = (value === 1);
      }
    });
  }

  private reset() {
    this.menus = null;
    this.permissions = [];
    this.role.Permissions = [];
    this.Selected = null;
    this.submitted = false;
    this.submitted_add = false;
    this.initForm();
    this.initAddForm();
    this.getRole(this.id);
  }

  //  Map boolean to integer 0 or 1
  private reverseMap(data: any): void {
    _map(data, (value, key) => {
      if (this.hasChild(value)) {
        this.reverseMap(value);
      }
      else {
        data[key] = value ? 1 : 0;
      }
    });
  }
}
