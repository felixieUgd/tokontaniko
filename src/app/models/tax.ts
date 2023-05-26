class Tax {
  id?: number;
  name?: string;
  rate?: number;
  type?: string;
  enabled?: boolean;
  created_at?: string;
  user_id?: number;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Tax;
