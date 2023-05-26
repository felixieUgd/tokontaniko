import Permission from './permission';
import User from './user';

class Role {
  id?: number;
  name?: string;
  display_name?: string;
  default_route?: string;
  description?: string;
  Permissions?: Permission[];
  Users?: User[];

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Role;
