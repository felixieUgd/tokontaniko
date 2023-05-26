import User from './user';

class Note {
  id: number;
  company_id: number;
  title: string;
  html: string;
  text?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  User: User;
  NoteHistories: any[];

  constructor(args = {}) {
    for (const key of Object.keys(args)) {
      this[key] = (args[key] === '') ? null : args[key];
    }
  }
}

export default Note;

