export interface Branch {
  id: string;
  name: string;
  location: string;
}

export type NotificationTone = 'danger' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: NotificationTone;
  read: boolean;
  link: string;
}