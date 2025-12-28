import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Analytics, MetricCard } from '../../core/models/analytics.model';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  analytics: Analytics | null = null;
  metrics: MetricCard[] = [];
  loading = false;
  error: string | null = null;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService.getAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Analytics) => {
          this.analytics = data;
          this.buildMetrics(data);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load analytics data';
          this.loading = false;
          console.error('Analytics loading error:', error);
        }
      });
  }

  private buildMetrics(analytics: Analytics): void {
    // Calculate growth percentages based on daily queries data
    const queriesGrowth = this.calculateGrowthPercentage(analytics.dailyQueries, 'queries');
    const usersGrowth = this.calculateGrowthPercentage(analytics.dailyQueries, 'users');

    this.metrics = [
      {
        title: 'TOTAL QUERIES',
        value: analytics.totalQueries,
        change: `${queriesGrowth >= 0 ? '+' : ''}${queriesGrowth}% from last month`,
        changeType: queriesGrowth >= 0 ? 'positive' : 'negative',
        icon: 'message'
      },
      {
        title: 'ACTIVE USERS',
        value: analytics.activeUsers,
        change: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth}% from last month`,
        changeType: usersGrowth >= 0 ? 'positive' : 'negative',
        icon: 'users'
      },
      {
        title: 'TOTAL USERS',
        value: analytics.totalUsers,
        change: 'All registered users',
        changeType: 'neutral',
        icon: 'users'
      },
      {
        title: 'CONVERSATIONS',
        value: analytics.totalConversations,
        change: 'Total conversations',
        changeType: 'neutral',
        icon: 'message'
      }
    ];
  }

  private calculateGrowthPercentage(dailyQueries: any[], type: string): number {
    // Simple growth calculation - you can enhance this based on your needs
    if (dailyQueries.length < 2) return 0;
    
    const recent = dailyQueries.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const previous = dailyQueries.slice(-14, -7).reduce((sum, day) => sum + day.count, 0);
    
    if (previous === 0) return recent > 0 ? 100 : 0;
    
    return Math.round(((recent - previous) / previous) * 100);
  }

  refreshAnalytics(): void {
    this.loadAnalytics();
  }
}
