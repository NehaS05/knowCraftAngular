import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ToastComponent } from './components/toast/toast.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { ModalComponent } from './components/modal/modal.component';

@NgModule({
  declarations: [
    LoadingIndicatorComponent,
    LoadingComponent,
    ToastComponent,
    ToastContainerComponent,
    ModalComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LoadingIndicatorComponent,
    LoadingComponent,
    ToastComponent,
    ToastContainerComponent,
    ModalComponent
  ]
})
export class SharedModule { }