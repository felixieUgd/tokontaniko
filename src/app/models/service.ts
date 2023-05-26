class Service {
  id: number;
  branch_id: number;
  name: string;
  description: string;
  label: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  deleted_at: string;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Service;
