import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from './components/modal/modal.component';
import { ToastComponent } from './components/toast/toast.component';
import { LoadingComponent } from './components/loading/loading.component';

@NgModule({
  declarations: [
    ModalComponent,
    ToastComponent,
    LoadingComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ModalComponent,
    ToastComponent,
    LoadingComponent
  ]
})
export class SharedModule { }