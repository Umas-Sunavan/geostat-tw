import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { BehaviorSubject, lastValueFrom, map, mergeMap, of, Subject, take } from 'rxjs';
import { MapHttpService } from 'src/app/modules/dashboard/map-http/map-http.service';
import { CategorySetting, CategorySettings, CategorySettingWithId } from 'src/app/shared/models/CategorySettings';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { CategoryService } from '../map-canvas/category/category.service';
import { AnimateService } from '../map-canvas/three-services/animate.service';

@Component({
  selector: 'app-category-picker',
  templateUrl: './category-picker.component.html',
  styleUrls: ['./category-picker.component.sass']
})
export class CategoryPickerComponent implements OnInit {

  constructor(
    private animateService: AnimateService,
    private categoryService: CategoryService,
    private mapHttpService: MapHttpService,
    private activatedRoute: ActivatedRoute,
  ) { }

  isShow: boolean = false
  blurSource: string = ''
  categories: CategorySettingWithId[] = []
  selectedCategoryValue: string = ''
  selectedCategoryName = ''
  selectedCategory?: CategorySetting
  isAddCategoryShow: boolean = false
  isAddNameShow:boolean = false
  addedName = ''
  isCompletedShow: boolean = false
  addingSheetUrl?: string
  addingCategoryId?: string
  categoryChangeSubject: Subject<string> = new Subject()
  @Output() changeCategoryToCanvas: EventEmitter<string> = new EventEmitter()

  initUpdateDefaultCategory = () => {
    this.categoryChangeSubject.pipe(
      mergeMap( categoryId => {
        const mapId = this.activatedRoute.snapshot.paramMap.get("id") || ''
        return of({mapId, categoryId})
      }), 
      mergeMap(({mapId, categoryId}) => this.mapHttpService.changeDefaultCategory(mapId, categoryId))
    ).subscribe( result => console.log(result))
  }

  getCategories = (categoriesObj: CategorySettings) => {
    const categoriesMappedId: CategorySettingWithId[] = []
    for (const categoryName in categoriesObj) {
      const category = categoriesObj[categoryName]
      const CategoryMappedId: CategorySettingWithId = { categoryId: categoryName, ...category }
      categoriesMappedId.push(CategoryMappedId)
    }
    return categoriesMappedId
  }

  updateSelectedCategory = (categories: CategorySettingWithId[] , selectedCategoryValue: string) => {
    const selectedCategory = categories.find( category => category.categoryId === selectedCategoryValue)
    if (selectedCategory) {
      this.selectedCategoryName = selectedCategory.tableName
    }
  }

  getCategoryFromFirebase = () => {
    this.categoryService.getCategorySettings().subscribe(categoriesObj => {
      this.categories = this.getCategories(categoriesObj)
      this.updateSelectedCategory(this.categories, this.selectedCategoryValue)
    })
  }

  getDefaultCategoryFromDb = async () => {
    const mapId = this.activatedRoute.snapshot.paramMap.get("id")
    if(mapId !== null && +mapId !== NaN) {
      const map: HttpMap = await lastValueFrom(this.mapHttpService.getMap(+mapId))
      return map.defualtCategoryId
    } else {
      throw new Error("map id is not a number");
    }
  }

  async ngOnInit(): Promise<void> {
    this.initUpdateDefaultCategory()
    const defaultCategoryId = await this.getDefaultCategoryFromDb()
    this.changeCategory(defaultCategoryId)
    this.getCategoryFromFirebase()
  }

  toggleShow = () => {
    this.isShow = !this.isShow
    if (this.isShow) {
      this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
        this.blurSource = `url(${value})`
      })
    }
  }
  changeCategory = (categoryId: string) => {
    this.selectedCategoryValue = categoryId
    this.categoryChangeSubject.next(categoryId)
    this.changeCategoryToCanvas.emit(categoryId)
    this.updateSelectedCategory(this.categories, categoryId)
  }

  // popup functions: 

  toggleAddCategory = () => this.isAddCategoryShow = !this.isAddCategoryShow

  nameMoveLastSetp = () => {
    this.toggleAddName()
    this.toggleAddCategory()
  }

  onGotSheetUrl = (url: string) => {
    console.log(url); 
    this.addingSheetUrl = url
    this.toggleAddName()
  }

  toggleAddName = () => this.isAddNameShow = !this.isAddNameShow

  toggleCompletedShow = () => this.isCompletedShow = !this.isCompletedShow

  switchCategoryFromPopup = (boolean: boolean) => {
    if (!this.addingCategoryId) throw new Error("no addingCategoryId. the category could failed without internet connection");
    this.changeCategory(this.addingCategoryId)    
  }

  onGotName = (name: string) => {
    this.toggleAddName()
    this.toggleCompletedShow()
    const defaultSetting = this.categoryService.mockSetting
    defaultSetting.tableName = name
    this.addedName = name
    if(!this.addingSheetUrl) throw new Error("no google sheet url before creating new category on database");
    defaultSetting.tableSource = this.categoryService.getSheetIdFromUrl(this.addingSheetUrl)
    this.addingCategoryId = this.categoryService.addCategory(defaultSetting) || ''
  }

  updateSelectedStyle = (id: string) => id === this.selectedCategoryValue ? `url('./assets/icons/checked-radio.svg')` : 'initial'

}
