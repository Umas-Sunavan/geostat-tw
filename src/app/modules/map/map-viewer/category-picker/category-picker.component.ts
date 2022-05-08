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
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  blurSource: string = ''
  categoriesMappedId:CategorySettingWithId[] = []

  async ngOnInit(): Promise<void> {
    this.categoryService.getCategorySettings().subscribe(categoriesObj => {
      const categoriesMappedId:CategorySettingWithId[] = []
      for (const categoryName in categoriesObj) {
        const category = categoriesObj[categoryName]
        const CategoryMappedId: CategorySettingWithId = { categoryId: categoryName, ...category}
        categoriesMappedId.push(CategoryMappedId)
      }
      console.log(categoriesMappedId);
      this.categoriesMappedId = categoriesMappedId
      categoriesMappedId[0].tableName
    }

    )
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

  categoryChanged = (category: CategorySetting, id: string) => {
    console.log(category);
    this.router.navigate(['/map', `/${id}`])
  }


}
