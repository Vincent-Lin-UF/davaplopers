import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface BucketItem {
  name: string;
  location: string;
  tags: string;
  image: string;
}

@Component({
  selector: 'app-bucket-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './bucket-list.html',
})
export class BucketList {

  bucketList: BucketItem[] = [
    {
      name: 'Visit Japan',
      location: 'Tokyo',
      tags: 'travel, culture',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    },
        {
      name: 'Visit Japan',
      location: 'Tokyo',
      tags: 'travel, culture',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    },
    {
      name: 'Skydiving',
      location: 'California',
      tags: 'adventure, high priority',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    },
        {
      name: 'Skydiving',
      location: 'California',
      tags: 'adventure, high priority',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    },
        {
      name: 'Skydiving',
      location: 'California',
      tags: 'adventure, high priority',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    },
        {
      name: 'Skydiving',
      location: 'California',
      tags: 'adventure, high priority',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    }
    ,    {
      name: 'Skydiving',
      location: 'California',
      tags: 'adventure, high priority',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfx451b6f6nSPYh7E2aN5Q24tyIxjKHXsqMg&s'
    }
  ];

}