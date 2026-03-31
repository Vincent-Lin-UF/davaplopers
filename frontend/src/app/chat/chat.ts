import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './chat.html',
})
export class ChatComponent {
  messages: Message[] = [];
  input = '';
  loading = false;

  constructor(private http: HttpClient) {}

  send() {
    const text = this.input.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.input = '';
    this.loading = true;

    this.http
      .post<{ message: string }>('http://localhost:8000/api/chat', {
        message: text,
      })
      .subscribe({
        next: (res) => {
          this.messages.push({ role: 'assistant', text: res.message });
          this.loading = false;
        },
        error: () => {
          this.messages.push({ role: 'assistant', text: 'Something went wrong.' });
          this.loading = false;
        },
      });
  }
}
