class Currency {
  id?: number;
  name?: string;
  code?: string;
  rate?: number;
  precision?: number;
  symbol?: string;
  symbol_position?: string;
  decimal_mark?: string;
  separator?: string;
  default?: boolean;
  enabled?: boolean;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Currency;
