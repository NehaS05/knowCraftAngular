import { Component } from '@angular/core';

interface MetricCard {
  title: string;
  value: number;
  change: string;
  icon: string;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent {
  metrics: MetricCard[] = [
    {
      title: 'TOTAL QUERIES',
      value: 1284,
      change: '+12% from last month',
      icon: 'message'
    },
    {
      title: 'ACTIVE USERS',
      value: 342,
      change: '+8% from last month',
      icon: 'users'
    }
  ];
}
