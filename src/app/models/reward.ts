export default class Reward {
  id: number;
  title: string;
  code: string;
  description: string;
  points_threshold: number;
  value: number;
  enabled: true;

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

