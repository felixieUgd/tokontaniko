class Permission {
  id?: number;
  name?: string;
  display_name?: string;
  description?: string;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Permission;
