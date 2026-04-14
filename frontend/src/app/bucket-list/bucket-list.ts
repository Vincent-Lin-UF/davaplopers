import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bucket-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bucket-list.html'
})
export class BucketList {
  showForm = false;
  searchTerm = '';

  priorityOptions = ['Low', 'Medium', 'High'];

  activityTypeOptions = [
    'Travel',
    'Adventure',
    'Food',
    'Nature',
    'Fitness',
    'Learning',
    'Social',
    'Entertainment'
  ];

  bucketList = [
    {
      name: 'Visit Tokyo',
      location: 'Japan',
      priority: 'High',
      activityTypes: ['Travel', 'Food'],
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf'
    },
    {
      name: 'See Northern Lights',
      location: 'Iceland',
      priority: 'Medium',
      activityTypes: ['Nature', 'Adventure'],
      image: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938'
    }
  ];

  newItem = {
    name: '',
    location: '',
    priority: '',
    activityTypes: [] as string[],
    image: ''
  };

  addItem(): void {
    if (
      !this.newItem.name.trim() ||
      !this.newItem.location.trim() ||
      !this.newItem.priority ||
      this.newItem.activityTypes.length === 0
    ) {
      return;
    }

    this.bucketList.push({
      name: this.newItem.name.trim(),
      location: this.newItem.location.trim(),
      priority: this.newItem.priority,
      activityTypes: [...this.newItem.activityTypes],
      image:
        this.newItem.image ||
        'https://via.placeholder.com/100x100.png?text=Item'
    });

    this.newItem = {
      name: '',
      location: '',
      priority: '',
      activityTypes: [],
      image: ''
    };

    this.showForm = false;
  }

  toggleActivityType(type: string): void {
    if (this.newItem.activityTypes.includes(type)) {
      this.newItem.activityTypes = this.newItem.activityTypes.filter(
        t => t !== type
      );
    } else {
      this.newItem.activityTypes = [...this.newItem.activityTypes, type];
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.newItem.image = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  filteredBucketList() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) return this.bucketList;

    return this.bucketList.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.priority.toLowerCase().includes(term) ||
      item.activityTypes.some(type => type.toLowerCase().includes(term))
    );
  }
}