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
import { Map3dSettingsComponent } from './modules/map/map-viewer/map-settings/map-3d-settings/map-3d-settings.component';
import { MapPinSettingsComponent } from './modules/map/map-viewer/map-settings/map-pin-settings/map-pin-settings.component';
import { MapSettingsComponent } from './modules/map/map-viewer/map-settings/map-settings.component';
import { CategoryPickerComponent } from './modules/map/map-viewer/category-picker/category-picker.component';
import { AddCategoryComponent } from './shared/add-category/add-category.component';
import { AddNameComponent } from './shared/add-name/add-name.component';
import { CompletedComponent } from './shared/completed/completed.component';
import { MapsComponent } from './modules/dashboard/maps/maps.component';
import { CategoriesComponent } from './modules/dashboard/categories/categories.component';
import { AddPinSheetComponent } from './shared/add-pin-sheet/add-pin-sheet.component';
import { LoginComponent } from './modules/login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    MapCanvasComponent,
    DashboardComponent,
    AuthComponent,
    HeaderComponent,
    FooterComponent,
    MapViewerComponent,
    Map3dSettingsComponent,
    MapPinSettingsComponent,
    MapSettingsComponent,
    CategoryPickerComponent,
    AddCategoryComponent,
    AddNameComponent,
    CompletedComponent,
    MapsComponent,
    CategoriesComponent,
    AddPinSheetComponent,
    LoginComponent,
    
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
