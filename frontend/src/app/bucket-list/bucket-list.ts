import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TripService, BucketItemOut } from '../services/trip.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export interface BucketItem {
  item_id?: number;
  trip_id?: number;
  name: string;
  location: string;
  priority: string;
  activityTypes: string[];
  image: string;
}

@Component({
  selector: 'app-bucket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, DragDropModule],
  templateUrl: './bucket-list.html',
})
export class BucketList implements OnInit {
  @Input() showNav = true;
  @Output() itemDropped = new EventEmitter<CdkDragDrop<any>>();
  @Output() itemDeleted = new EventEmitter<BucketItem>();

  tripId: number | null = null;
  showForm = false;
  searchTerm = '';
  editingIndex: number | null = null;
  saving = false;
  searchPreview: { name: string; image: string } | null = null;

  priorityOptions = ['Low', 'Medium', 'High'];
  activityTypeOptions = ['Travel','Adventure','Food','Nature','Fitness','Learning','Social','Entertainment'];

  bucketList: BucketItem[] = [];
  newItem: BucketItem = { name: '', location: '', priority: '', activityTypes: [], image: '' };

  toastMsg = '';
  private toastTimeout: any;

  isOwner = false;
  loading = true;

  constructor(
    private tripSvc: TripService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
  ) {}

  showToast(msg: string) {
    this.toastMsg = msg;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 2000);
  }

  logout() {
    this.auth.logout();
    this.tripSvc.clearTrip();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.tripSvc.getOrCreateTrip().subscribe({
      next: (id) => {
        this.tripId = id;
        if (this.showNav) {
          this._loadAll();
        } else {
          this._load();
        }
        this.tripSvc.getTripDetails(id).subscribe(trip => {
          const user = this.auth.getUser();
          this.isOwner = !!(user && user.user_id === trip.user_id);
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
  }

  private _load() {
    if (!this.tripId) return;
    // Uses cache — instant on subsequent visits
    this.tripSvc.listItems(this.tripId).subscribe({
      next: (rows) => {
        this.bucketList = rows.map(r => this._map(r));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  private async _loadAll() {
    try {
      const trips = await firstValueFrom(this.tripSvc.listAllTrips());
      if (!trips.length) {
        this.bucketList = [];
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }
      const arrays = await Promise.all(trips.map(t =>
        firstValueFrom(
          this.http.get<BucketItemOut[]>(`${environment.apiBase}/api/trips/${t.trip_id}/items`).pipe(
            catchError(() => of([] as BucketItemOut[]))
          )
        )
      ));
      const items = arrays.flat();
      this.bucketList = items.map(r => this._map(r));
    } catch {}
    this.loading = false;
    this.cdr.detectChanges();
  }

  private _map(r: BucketItemOut): BucketItem {
    return {
      item_id: r.item_id,
      trip_id: r.trip_id,
      name: r.title,
      location: r.location_name ?? '',
      priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
      activityTypes: r.category ? r.category.split(',').map(s => s.trim()) : [],
      image: r.image || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    };
  }

  // ── Location Search ───────────────────────────────────────────────────────

  searchLocation(): void {
    const term = this.searchTerm.trim();
    if (!term) return;
    const imageUrl = `https://loremflickr.com/400/300/${encodeURIComponent(term + ',travel,landmark')}`;
    this.searchPreview = { name: term, image: imageUrl };
  }

  addFromSearch(): void {
    if (!this.searchPreview) return;
    const location = this.searchPreview.name;
    const image = this.searchPreview.image;
    this.searchPreview = null;

    const payload = { title: location, location_name: location, priority: 'medium', category: 'Travel', image };

    if (this.tripId) {
      this.tripSvc.createItem(this.tripId, payload).subscribe({
        next: (c) => { this.bucketList.push(this._map(c)); },
        error: () => { this.bucketList.push({ name: location, location, priority: 'Medium', activityTypes: ['Travel'], image }); },
      });
    } else {
      this.bucketList.push({ name: location, location, priority: 'Medium', activityTypes: ['Travel'], image });
    }
    this.searchTerm = '';
  }

  onDrop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.bucketList, event.previousIndex, event.currentIndex);
    } else {
      this.itemDropped.emit(event);
    }
  }

  addItem(): void {
    if (!this.newItem.name.trim() || !this.newItem.location.trim() || !this.newItem.priority || this.newItem.activityTypes.length === 0 || this.saving) return;
    this.saving = true;

    const payload = {
      title: this.newItem.name.trim(),
      location_name: this.newItem.location.trim(),
      priority: this.newItem.priority.toLowerCase(),
      category: this.newItem.activityTypes.join(', '),
      image: this.newItem.image || null,
    };

    if (this.editingIndex !== null && this.tripId) {
      const existing = this.bucketList[this.editingIndex];
      const editTripId = existing.trip_id || this.tripId;
      if (existing.item_id) {
        this.tripSvc.updateItem(editTripId, existing.item_id, payload).subscribe({
          next: (u) => { this.bucketList[this.editingIndex!] = this._map(u); this.resetForm(); this.saving = false; },
          error: () => { this.saving = false; },
        });
      } else {
        this.bucketList[this.editingIndex] = { ...this.newItem };
        this.resetForm(); this.saving = false;
      }
    } else if (this.tripId) {
      this.tripSvc.createItem(this.tripId, payload).subscribe({
        next: (c) => { this.bucketList.push(this._map(c)); this.resetForm(); this.saving = false; },
        error: () => { this.bucketList.push({ ...this.newItem }); this.resetForm(); this.saving = false; },
      });
    } else {
      this.bucketList.push({ ...this.newItem }); this.resetForm(); this.saving = false;
    }
  }

  editItem(index: number): void {
    const item = this.bucketList[index];
    this.newItem = { name: item.name, location: item.location, priority: item.priority, activityTypes: [...item.activityTypes], image: item.image };
    this.editingIndex = index; this.showForm = true;
  }

  deleteItem(index: number): void {
    const item = this.bucketList[index];
    if (!confirm(`Delete "${item.name}" from your bucket list?`)) return;
    const tripId = item.trip_id || this.tripId;
    if (item.item_id && tripId) {
      this.tripSvc.deleteItem(tripId, item.item_id).subscribe({
        next: () => { this._splice(index); this.itemDeleted.emit(item); },
        error: () => { this.showToast("Couldn't delete — you may not have permission."); },
      });
    } else {
      this._splice(index);
      this.itemDeleted.emit(item);
    }
  }

  private _splice(index: number) {
    this.bucketList.splice(index, 1);
    if (this.editingIndex === index) this.resetForm();
    else if (this.editingIndex !== null && index < this.editingIndex) this.editingIndex--;
  }

  cancelEdit() { this.resetForm(); }

  resetForm(): void {
    this.newItem = { name: '', location: '', priority: '', activityTypes: [], image: '' };
    this.editingIndex = null; this.showForm = false;
  }

  toggleActivityType(type: string): void {
    if (this.newItem.activityTypes.includes(type)) {
      this.newItem.activityTypes = this.newItem.activityTypes.filter(t => t !== type);
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
      const img = new Image();
      img.onload = () => {
        // Resize to max 600px on longest side and JPEG-compress, so base64 stays small
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        this.newItem.image = canvas.toDataURL('image/jpeg', 0.75);
        this.cdr.detectChanges();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  filteredBucketList(): BucketItem[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.bucketList;
    return this.bucketList.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.priority.toLowerCase().includes(term) ||
      item.activityTypes.some(t => t.toLowerCase().includes(term))
    );
  }
}