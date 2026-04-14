import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BucketList } from '../bucket-list/bucket-list';

interface CalEvent {
  date: string; // YYYY-MM-DD
  title: string;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, BucketList],
  templateUrl: './calendar.html',
})
export class CalendarComponent {
  today = new Date();
  current = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

  events: CalEvent[] = [];
  selectedDate: string | null = null;
  newEventTitle = '';

  get monthLabel() {
    return this.current.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  get days(): DayCell[] {
    const year = this.current.getFullYear();
    const month = this.current.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];

    for (let i = firstDow - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({
        date: new Date(
          last.getFullYear(),
          last.getMonth(),
          last.getDate() + 1
        ),
        inMonth: false,
      });
    }

    return cells;
  }

  eventsOn(date: Date): CalEvent[] {
    return this.events.filter((e) => e.date === this.fmt(date));
  }

  isToday(date: Date) {
    return this.fmt(date) === this.fmt(this.today);
  }

  isSelected(date: Date) {
    return this.fmt(date) === this.selectedDate;
  }

  selectDay(cell: DayCell) {
    this.selectedDate = this.fmt(cell.date);
    this.newEventTitle = '';
  }

  addEvent() {
    if (!this.selectedDate || !this.newEventTitle.trim()) return;

    this.events.push({
      date: this.selectedDate,
      title: this.newEventTitle.trim(),
    });

    this.newEventTitle = '';
  }

  prevMonth() {
    this.current = new Date(
      this.current.getFullYear(),
      this.current.getMonth() - 1,
      1
    );
  }

  nextMonth() {
    this.current = new Date(
      this.current.getFullYear(),
      this.current.getMonth() + 1,
      1
    );
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}