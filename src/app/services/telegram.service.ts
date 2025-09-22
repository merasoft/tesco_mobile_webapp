import { Injectable } from '@angular/core';

declare global {
  interface Window {
    Telegram: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private tg = window.Telegram?.WebApp;

  constructor() {
    this.tg?.ready();
  }

  get MainButton() {
    return this.tg?.MainButton;
  }

  get initData() {
    return this.tg?.initData || '';
  }

  get user() {
    return this.tg?.initDataUnsafe?.user;
  }

  showMainButton(text: string, callback: () => void) {
    if (this.MainButton) {
      this.MainButton.setText(text);
      this.MainButton.show();
      this.MainButton.onClick(callback);
    }
  }

  hideMainButton() {
    this.MainButton?.hide();
  }

  close() {
    this.tg?.close();
  }

  sendData(data: any) {
    this.tg?.sendData(JSON.stringify(data));
  }
}
