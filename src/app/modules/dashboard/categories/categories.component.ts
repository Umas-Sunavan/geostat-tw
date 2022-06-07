import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, map } from 'rxjs';
import { CategorySettings, CategorySettingWithId } from 'src/app/shared/models/CategorySettings';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { MapHttpService } from 'src/app/shared/services/map-http/map-http.service';
import { CategoryService } from '../../map/map-viewer/map-canvas/category/category.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.sass']
})
export class CategoriesComponent implements OnInit {

  constructor(
    private router: Router,
    private mapHttpService: MapHttpService,
    private categoryService: CategoryService,
  ) { }
  

  isAdderShow: boolean = false
  isNamingShow: boolean = false
  isCompletedShow: boolean = false
  editingCategoryId?: string
  
  categoryNameToAdd: string = ""
  categoryUrlToAdd: string = ""
  categories: CategorySettingWithId[] = []
  editButtonTopPosition = "0px"

  categorySettingsAppendKeyName = (categoriesObj: CategorySettings) => {
    const categoriesMappedId = []
      for (const categoryName in categoriesObj) {
      const category = categoriesObj[categoryName]
      const CategoryMappedId: CategorySettingWithId = { categoryId: categoryName, ...category }
      categoriesMappedId.push(CategoryMappedId)
    }
    return categoriesMappedId
  }

  async ngOnInit(): Promise<void> {
    this.categoryService.getCategorySettings().pipe( map( this.categorySettingsAppendKeyName ) ).subscribe( categories => {
      this.categories = categories
    })
  }

  // category adder
  
  @Input() toggleAdderShow = () => this.isAdderShow = !this.isAdderShow

  @Input() onAdded = (url : string) => {
    this.categoryUrlToAdd = url
    this.toggleAddNameShow()
  }

  // category naming



  toggleAddNameShow = () => this.isNamingShow = !this.isNamingShow

  nameMoveLastSetp = () => {
    this.toggleAdderShow()
    this.toggleAddNameShow()
  }

  @Input() onNamingCancel = () => {
    this.nameMoveLastSetp()
  }

  @Input() onNamed = (name: string) => {
    this.categoryNameToAdd = name
    const defaultSetting = this.categoryService.mockSetting
    defaultSetting.tableName = name
    if(!this.categoryUrlToAdd) throw new Error("no google sheet url before creating new category on database");
    defaultSetting.tableSource = this.categoryService.getSheetIdFromUrl(this.categoryUrlToAdd)
    this.categoryService.addCategory(defaultSetting)
    this.toggleCompletedShow()
    this.toggleAddNameShow()
  }

  // category adding complete


  @Input() toggleCompletedShow = () => this.isCompletedShow = !this.isCompletedShow

  // event binding

  onDeleteClick = async (event: MouseEvent, id: string) => {
    event.stopPropagation();
    console.log(id);
    this.categoryService.deleteCategorySetting(id)
  }

  onEditClick = (event: MouseEvent, id: string) => {
    event.stopPropagation();
    this.editingCategoryId = id
    const card = event.target as HTMLDivElement
    this.calculateCardYPosition(card, card.parentElement?.parentElement)
  }

  editSourceTable = async (event: MouseEvent, id: string) => {
    const category = this.categories.find( category => category.categoryId === id)
    if (!category) throw new Error("no url link provided in the firebase category data");
    window.open(`https://docs.google.com/spreadsheets/d/${category.tableSource}/edit`, '_blank');
  }

  calculateCardYPosition = (card: HTMLDivElement, scrollContainer?: HTMLElement|null) => {
    if (card.parentElement && scrollContainer) {
      const cardCorrectY = card.offsetTop - scrollContainer.scrollTop
      this.editButtonTopPosition = cardCorrectY + 'px'
    }
  }

  clickSpace = (event: MouseEvent) => {
    event.stopPropagation();
    this.editingCategoryId = undefined
  }


}
