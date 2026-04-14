import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { BucketList, BucketItem } from '../bucket-list/bucket-list';

interface CalEvent {
  date: string;
  item: BucketItem;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  id: string;
  events: CalEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, BucketList],
  templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit {
  @ViewChild(BucketList) bucketListComponent!: BucketList;

  today = new Date();
  current = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

  events: CalEvent[] = [];
  selectedDate: string | null = null;
  days: DayCell[] = [];

  ngOnInit() {
    this.generateDays();
  }

  get monthLabel() {
    return this.current.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  generateDays() {
    const year = this.current.getFullYear();
    const month = this.current.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];

    for (let i = firstDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false, id: this.fmt(d), events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, inMonth: true, id: this.fmt(dt), events: [] });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: d, inMonth: false, id: this.fmt(d), events: [] });
    }

    cells.forEach(cell => {
      cell.events = this.events.filter(e => e.date === cell.id);
    });

    this.days = cells;
  }

  isToday(date: Date) {
    return this.fmt(date) === this.fmt(this.today);
  }

  isSelected(date: Date) {
    return this.fmt(date) === this.selectedDate;
  }

  selectDay(cell: DayCell) {
    this.selectedDate = this.fmt(cell.date);
  }

  allowCalendarDrop = (drag: CdkDrag<any>, drop: CdkDropList<DayCell>) => {
    return true;
  };

  dropOnDay(event: CdkDragDrop<DayCell>, cell: DayCell) {
    if (event.previousContainer.id === 'bucketList') {
      const item = event.item.data as BucketItem;
      
      const idx = this.bucketListComponent.bucketList.findIndex(i => i === item);
      if (idx !== -1) {
        this.bucketListComponent.bucketList.splice(idx, 1);
      }

      const newEvent: CalEvent = { date: cell.id, item };
      this.events.push(newEvent);
      cell.events.push(newEvent);
      this.selectedDate = cell.id;
    } else {
      if (event.previousContainer !== event.container) {
        const calEvent = event.item.data as CalEvent;
        const prevCellData = event.previousContainer.data as DayCell;
        const evIdx = prevCellData.events.findIndex(e => e === calEvent);
        if (evIdx > -1) prevCellData.events.splice(evIdx, 1);

        calEvent.date = cell.id;
        cell.events.push(calEvent);
        this.selectedDate = cell.id;
      }
    }
  }

  dropToBucketList(event: CdkDragDrop<any>) {
    if (event.previousContainer.id !== 'bucketList') {
      const calEvent = event.item.data as CalEvent;
      
      const globalIdx = this.events.findIndex(e => e === calEvent);
      if (globalIdx > -1) {
        this.events.splice(globalIdx, 1);
      }

      const prevCellData = event.previousContainer.data as DayCell;
      if (prevCellData && prevCellData.events) {
         const evIdx = prevCellData.events.findIndex(e => e === calEvent);
         if (evIdx > -1) prevCellData.events.splice(evIdx, 1);
      }

      this.bucketListComponent.bucketList.push(calEvent.item);
    }
  }

  prevMonth() {
    this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1);
    this.generateDays();
  }

  nextMonth() {
    this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1);
    this.generateDays();
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}