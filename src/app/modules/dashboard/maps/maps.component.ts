import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, mergeMap, of } from 'rxjs';
import { Auth0User } from 'src/app/shared/models/Auth0User';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { MapHttpService } from 'src/app/shared/services/map-http/map-http.service';
import { CategoryService } from '../../map/map-viewer/map-canvas/category/category.service';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.sass']
})
export class MapsComponent implements OnInit {


  constructor(
    private router: Router,
    private mapHttpService: MapHttpService,
    private categoryService: CategoryService,
  ) { }

  showNamingPopup: boolean = false
  maps: HttpMap[] = []
  mapIdRenaming?: number
  editingMapId: number | null = null
  addedMapName: string = ""
  addedMapId: string = ""
  showAddCompletePopup: boolean = false
  @Input('setEditingMapId') set setEditingMapId (id: number) {
    console.log(id);
    
    this.editingMapId = id
  }
  editButtonTopPosition = "0px"
  showRenamingPopup: boolean = false
  userData?: Auth0User
  @Input() set onUserInit(userData: Auth0User| undefined) {
    if (!userData) return 
    this.userData = userData;
    // (async () => {
    //   this.maps = await lastValueFrom(this.updateList())
    // })()
    this.updateList().subscribe( maps => this.maps)
  }

  async ngOnInit(): Promise<void> {
    
  }

  // naming popup

  toggleNamingPopup = () => this.showNamingPopup = !this.showNamingPopup

  @Input() onNamed = (name :string) => {
    this.categoryService.addCategoryOptions(this.categoryService.mockOptions).then( optionId => {
      console.log(optionId);
      if (!optionId) throw new Error("failed to create category options");
      this.mapHttpService.addMap(name,"admin", "-N-SasgrgpgWs2szH-aH",optionId).pipe(
        mergeMap( result => {
          this.addedMapName = result.name
          this.addedMapId = result.id
          this.toggleAddCompletePopup()
          return of(result)
        }),
        mergeMap( result => this.updateList()),
      ).subscribe( list => this.maps = list)
    })
    this.toggleNamingPopup()
  }

  // naming complete popup

  toggleAddCompletePopup = () => this.showAddCompletePopup = !this.showAddCompletePopup

  onNamingCompleted = () => this.switchNewMap()

  switchNewMap = () => {
    if (this.addedMapId && +this.addedMapId) {
      this.onMapClick(+this.addedMapId)
    } else {
      throw new Error("the map id that was added is not an number");
    }
  }

  // renaming popup

  toggleRenamingPopup = () => this.showRenamingPopup = !this.showRenamingPopup

  @Input() onRenamed = async (name: string) => {
    if(!this.mapIdRenaming) throw new Error("no rename id found");
    await lastValueFrom(this.mapHttpService.renameMap(this.mapIdRenaming, name))
    this.maps = await lastValueFrom(this.updateList())
    this.toggleRenamingPopup()
  }

  // modal

  onMapClick = (id: number) => this.router.navigate(['map',id])

  onAddClick = (event: MouseEvent) => this.toggleNamingPopup()

  onRenameClick = (event: MouseEvent, id: number) => {
    this.mapIdRenaming = id
    event.stopPropagation();
    this.toggleRenamingPopup()
  }

  onDeleteClick = async (event: MouseEvent, id: number) => {
    event.stopPropagation();
    await lastValueFrom(this.mapHttpService.deleteMap(id))
    this.maps = await lastValueFrom(this.updateList())
  }

  onEditClick = (event: MouseEvent, id: number) => {
    const card = event.target as HTMLDivElement
    this.calculateCardYPosition(card, card.parentElement?.parentElement?.parentElement)
    event.stopPropagation();
    this.editingMapId = id
  }

  updateList = () => this.mapHttpService.getMaps()

  calculateCardYPosition = (card: HTMLDivElement, scrollContainer?: HTMLElement|null) => {
    if (!card.parentElement || !scrollContainer) throw new Error("no card editing popup or whose parent scroll container found");
      const cardCorrectY = card.offsetTop - scrollContainer.scrollTop
      this.editButtonTopPosition = cardCorrectY + 'px'
  }

  clickSpace = (event: MouseEvent) => {
    event.stopPropagation();
    this.editingMapId = null
  }
}
