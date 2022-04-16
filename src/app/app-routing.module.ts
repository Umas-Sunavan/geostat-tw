import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapCanvasComponent } from './modules/map/map-viewer/map-canvas/map-canvas.component';
import { MapViewerComponent } from './modules/map/map-viewer/map-viewer.component';

const routes: Routes = [
  {
    path: 'map/:id',
    component: MapViewerComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
