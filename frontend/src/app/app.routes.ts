import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/simulate/simulate.component').then(
        (m) => m.SimulateComponent
      ),
  },
];
