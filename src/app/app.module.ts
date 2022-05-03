import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './modules/auth/auth/auth.component';
import { HeaderComponent } from './core/layouts/header/header/header.component';
import { FooterComponent } from './core/layouts/footer/footer/footer.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MapCanvasComponent } from './modules/map/map-viewer/map-canvas/map-canvas.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { MapViewerComponent } from './modules/map/map-viewer/map-viewer.component';
import { MapSettingsComponent } from './modules/map/map-viewer/map-settings/map-settings/map-settings.component';

@NgModule({
  declarations: [
    AppComponent,
    MapCanvasComponent,
    DashboardComponent,
    AuthComponent,
    HeaderComponent,
    FooterComponent,
    MapViewerComponent,
    MapSettingsComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
