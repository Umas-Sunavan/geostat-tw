import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { BehaviorSubject, lastValueFrom, map, mergeMap, of, Subject, take, tap } from 'rxjs';
import { MapHttpService } from 'src/app/shared/services/map-http/map-http.service';
import { CategorySetting, CategorySettings, CategorySettingWithId } from 'src/app/shared/models/CategorySettings';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { CategoryService } from '../map-canvas/category/category.service';
import { AnimateService } from '../map-canvas/three-services/animate.service';
import { PinsTableService } from '../map-canvas/pin-services/pins-table.service';

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
    private pinsTableService: PinsTableService,
  ) { }

  isCategoriesShow: boolean = false
  blurSource: string = ''
  categories: CategorySettingWithId[] = []
  selectedCategoryValue: string = ''
  selectedCategoryName = ''
  selectedCategory?: CategorySetting
  @Input() isAddCategoryShow: boolean = false
  isAddNameShow:boolean = false
  addedName = ''
  isCompletedShow: boolean = false
  addingSheetUrl?: string
  addingCategoryId?: string
  categoryChangeSubject: Subject<string> = new Subject()
  @Output() changeCategoryToCanvas: EventEmitter<string> = new EventEmitter()
  @Input('setMapModelFromDb') set setMapModelFromDb(map:HttpMap) {
    if (map) {
      this.onGetMapModel(map)
    }
  }
  pinSheetId?: string

  initDefaultCategorySubscriber = () => {
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
    return this.categoryService.getCategorySettings().pipe( map(categoriesObj => this.getCategories(categoriesObj)))
  }

  // getMapDataFromDb = async () => {
  //   const mapId = this.activatedRoute.snapshot.paramMap.get("id")
  //   if(mapId !== null && +mapId !== NaN) {
  //     const map: HttpMap = await lastValueFrom(this.mapHttpService.getMap(+mapId))
  //     return map
  //   } else {
  //     throw new Error("map id is not a number");
  //   }
  // }

  onGetMapModel = (map: HttpMap) => {
    if (map.pinSheetId) {
      console.log(map);
      this.pinsTableService.getAddressFromSourceSheet(map.pinSheetId).pipe(take(1)).subscribe( pinSheet => {
        if(!pinSheet) throw new Error("no sheet source table id found");
        this.changeCategory(map.defaultCategoryId)
        this.getCategoryFromFirebase().subscribe( categories => {
          console.log(categories.map( category => category.tableForPinSheetId));
          console.log(map.pinSheetId);
          this.checkCategoriesHasNoPinSheet(categories)
          const categoriesForPinSheet = categories.filter( category => category.tableForPinSheetId === map.pinSheetId)
          this.createOneIfNone(categoriesForPinSheet)
          this.updateSelectedCategory(categoriesForPinSheet, this.selectedCategoryValue)
          this.categories = categoriesForPinSheet
          this.pinSheetId = map.pinSheetId
        })
      })
    } else {
      throw new Error("map sheet id from DB is not found");
    }
  }

  createOneIfNone = (categories: CategorySettingWithId[]) => categories.length === 0 ? this.toggleAddCategory() : ''

  checkCategoriesHasNoPinSheet = (categories: CategorySettingWithId[]) => {
    categories.forEach( category => {
      const hasPinSheetId = Boolean(category.tableForPinSheetId)
      if (!hasPinSheetId) {
        console.error("a category has no pin sheet id specified. categoryId: ", category.categoryId);
      }
    })
  }

  async ngOnInit(): Promise<void> {
    this.initDefaultCategorySubscriber()
  }

  toggleShow = () => {
    this.isCategoriesShow = !this.isCategoriesShow
    if (this.isCategoriesShow) {
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
    defaultSetting.tableForPinSheetId = this.pinSheetId || ''
    this.addingCategoryId = this.categoryService.addCategory(defaultSetting) || ''
  }

  updateSelectedStyle = (id: string) => id === this.selectedCategoryValue ? `url('./assets/icons/checked-radio.svg')` : 'initial'

}
