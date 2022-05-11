import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { lastValueFrom, take } from 'rxjs';
import { CategorySetting, CategorySettings, CategorySettingWithId } from 'src/app/shared/models/CategorySettings';
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
    private router: Router,
  ) { }

  blurSource: string = ''
  categoriesMappedId: CategorySettingWithId[] = []
  radioValue: string = ''
  isAddCategoryShow: boolean = false
  isAddNameShow:boolean = false
  addedName = ''
  isCompletedShow: boolean = false
  addingSheetUrl?: string
  addingCategoryId?: string


  async ngOnInit(): Promise<void> {
    this.categoryService.getCategorySettings().subscribe(categoriesObj => {
      const categoriesMappedId: CategorySettingWithId[] = []
      for (const categoryName in categoriesObj) {
        const category = categoriesObj[categoryName]
        const CategoryMappedId: CategorySettingWithId = { categoryId: categoryName, ...category }
        categoriesMappedId.push(CategoryMappedId)
      }
      console.log(categoriesMappedId);
      this.categoriesMappedId = categoriesMappedId
      categoriesMappedId[0].tableName
    })
  }

  isShow: boolean = true

  toggleShow = () => {
    this.isShow = !this.isShow
    if (this.isShow) {
      this.animateService.getCavasImage().pipe(take(1)).subscribe(value => {
        this.blurSource = `url(${value})`
      })
    }
  }

  categoryChanged = (id: string) => {
    this.router.navigate(['/map', `${id}`])
  }

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

  switchNewCategory = (boolean: boolean) => {
    console.log(this.isCompletedShow);
    if (!this.addingCategoryId) throw new Error("no addingCategoryId. the category could failed without internet connection");
    this.categoryChanged(this.addingCategoryId)
    this.radioValue = this.addingCategoryId
  }

  onGotName = (name: string) => {
    this.toggleAddName()
    this.toggleCompletedShow()
    const defaultSetting = this.categoryService.mockSetting
    defaultSetting.tableName = name
    this.addedName = name
    if(!this.addingSheetUrl) throw new Error("no google sheet url before creating new category on database");
    defaultSetting.tableSource = this.addingSheetUrl
    this.addingCategoryId = this.categoryService.addCategory(defaultSetting) || ''
  }

}
