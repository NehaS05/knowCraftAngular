import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.subscription = this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}