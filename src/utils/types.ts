export enum ListName {
  Inbox = 'Inbox',
  Today = 'Today',
  Anytime = 'Anytime',
  Upcoming = 'Upcoming',
  Someday = 'Someday',
}


export interface Todo {
  id: string;
  title: string;
  notes: string;
}