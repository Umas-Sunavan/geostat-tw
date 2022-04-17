import { AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader, Intersection, CylinderGeometry, MeshMatcapMaterial, CircleGeometry, Group } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';			
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BehaviorSubject, concatMap, delay, exhaustMap, filter, forkJoin, from, interval, last, lastValueFrom, map, mapTo, merge, mergeMap, Observable, of, Subject, Subscriber, switchMap, take, tap, timeout, timer } from 'rxjs';
import { CategorySetting, CategorySettings } from 'src/app/shared/models/CategorySettings';
import { ActivatedRoute } from '@angular/router';
import { PinCategoryMappingService } from '../../pin-category-mapping.service';
import { SceneService } from './three-services/scene.service';
import { RendererService } from './three-services/renderer.service';
import { CameraService } from './three-services/camera.service';
import { AnimateService } from './three-services/animate.service';
import { LightService } from './three-services/light.service';
import { TileService } from './tile-services/tile.service';
import { TileUtilsService } from './tile-services/tile-utils.service';
import { TileLonglatCalculationService } from './tile-services/tile-longlat-calculation.service';
import { PinsTableService } from './pin-services/pins-table.service';
import { PinModelService } from './pin-services/pin-model.service';
import { Column3dService } from './column-3d-services/column-3d.service';
import { Tile } from 'src/app/shared/models/Tile';
import { Pin } from 'src/app/shared/models/Pin';
import { CategoryService } from './category/category.service';
import { Gui3dSettings } from 'src/app/shared/models/GuiColumnSettings';
import { PinUtilsService } from './pin-services/pin-utils.service';



@Component({
  selector: 'app-map-canvas',
  templateUrl: './map-canvas.component.html',
  styleUrls: ['./map-canvas.component.sass']
})
export class MapCanvasComponent implements OnInit, AfterViewInit {

  constructor(
    private sceneService: SceneService,
    private rendererService: RendererService,
    private cameraService: CameraService,
    private animateService: AnimateService,
    private lightService: LightService,
    private tileService: TileService,
    private tileUtilsService: TileUtilsService,
    private tileLonLatCalculation: TileLonglatCalculationService,
    private categoryService: CategoryService,
    private activatedRoute: ActivatedRoute,
    private pinModelService: PinModelService,
    private pinUtilsService: PinUtilsService,
    private column3dService: Column3dService,
    ) {
    this.initQueueToUpdateResolution()
    
  }

  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLCanvasElement>;
  scene: Scene = new Scene()
  renderer: WebGLRenderer = new WebGLRenderer()
  camera: Camera = new PerspectiveCamera()
  orbitControl!: OrbitControls
  box?: Object3D
  box2?: Object3D
  ground!: Object3D
  mousePosition: Vector2 = new Vector2(0, 0)
  plane!: Object3D
  tiles: Tile[] = []
  lines: Line<BufferGeometry, LineBasicMaterial>[] = []
  onUserUpdateCamera: Subject<string> = new BehaviorSubject('')
  queueToUpdateResolution!: Observable<string>
  tilesToMerge: Tile[] = []
  pins: Pin[] = []
  isPaused: boolean = false
  categoryId = '-N-SyzGWgpgWs2szH-aH'
  hoveringPins?: Pin[]
  hoverPinChangeSuject: BehaviorSubject<Pin[]> = new BehaviorSubject(([] as Pin[]))
  font!: Font
  @Output() hoverOnPin: EventEmitter<{pin: Pin, legendPosition: Vector2}| undefined> = new EventEmitter()
  canvasDimention = new Vector2(600, 450)
  screenRatio = 2

  // view
  guiColumnSettings:Gui3dSettings = {
    column: {
      opacity: 0.1,
      color: '#528bff',
      heightScale: 1,
      scale: 0.5,
    }, 
    ground: {
      color: '#528bff',
      opacity: 0.5,  
    }, 
    outline: {
      color: '#ffffff',
      opacity: 0.02,
    }
  }
  

  initQueueToUpdateResolution = () => {
    this.queueToUpdateResolution = new Observable(subscriber => {
      this.tileService.updateTilesResolution(this.tiles, this.scene, this.camera).then(next => {
        this.tiles = next
        subscriber.next()
      })
    })
  }

  uiUpdatePin = (event: Event) => this.updatePin3ds(this.pins, this.scene)


  resetHoveredMeshes = (pins: Pin[]) => {
    pins.forEach( pin => {
      const {column, ground} = this.pinUtilsService.getMeshesById(pins, pin.id)
      column.material.opacity = this.guiColumnSettings.column.opacity
      column.material.color = new Color(this.column3dService.parseStringColorToInt(this.guiColumnSettings.column.color))
      column.material.depthWrite  = false
    })
  }

  changeHoveringMeshes = (pins: Pin[]) => {
    pins.forEach( pin => {
      const {column, ground} = this.pinUtilsService.getMeshesById(pins, pin.id)
      column.material.depthWrite  = true
      column.material.opacity = 0.6
      column.material.color = new Color(0xffff00)
    })
  }

  getPositionOnHtml = (mousePosition: Vector2, canvasDomention: Vector2) => { 
    // if the canvas is 600 wide and 450 tall
    // this.mousePosition.x: -1~1, which should map to canvas left(0) to right(600)
    // this.mousePosition.y: 1~-1, which should map to canvas top(0) to bottom(-450)
    const x = (this.mousePosition.x + 1) / 2 * this.canvasDimention.x
    const y = (this.mousePosition.y - 1) / 2 * this.canvasDimention.y
    return new Vector2(x,y)
  }

  async ngOnInit(): Promise<void> {
    this.hoverPinChangeSuject.subscribe( pins => {
    })
    this.timeoutToPause()
    this.initOnUserUpdateResolution()
    this.animateService.onMouseIntersect.subscribe( intersections => this.onMouseIntersect(intersections))
    this.pins = await this.pinModelService.initPinsModel()
    
    // this.pointDimensionService.writeUserData()
  }

  getPinIdFromGroup = (group:Group) => {
    const id = group.name.match(/(?=.+_?)\d+/);
    const isValidId = id && id[0]
    if(isValidId) {
      return id[0]
    } else {
      throw new Error("hovered pin has no valid id");
    }
  }

  onMouseIntersect = (intersections: Intersection[]) => {
    const getIds = (intersections: Intersection[]) => {
        const group = this.getPinGroup(intersections) // called "group" for a pin is formed with a group of meshes
        return group.map( group => this.getPinIdFromGroup(group))
    }
    const ids = getIds(intersections)
    const pins = this.pinUtilsService.findPinById(this.pins, ids)
    this.changeLegendText(pins[0])
    this.onPinsHovered(pins)
  }

  onPinsHovered = (pins:Pin[]) => {
    pins = pins.slice(0,1)
    const groups = this.pinUtilsService.mappingToMeshes(pins) as Group[]
    const isAnyPinHovered =pins.length > 0
    this.column3dService.setDepthWrite(groups, isAnyPinHovered, ['column', 'ground'])
    const hoveredMesh = this.hoveringPins || []
    this.resetHoveredMeshes(hoveredMesh)
    this.hoveringPins = pins
    this.changeHoveringMeshes(this.hoveringPins)
  }

  changeLegendText = (pin?: Pin) => {
    if (pin) {
      // this.mousePosition.x: -1~1
      // this.mousePosition.y: 1~-1
      const htmlAbsolutePosition = this.getPositionOnHtml(this.mousePosition, this.canvasDimention)
      this.hoverOnPin.emit({pin: pin, legendPosition: htmlAbsolutePosition})
    } else {
      this.hoverOnPin.emit()
    }
  }

  filterDuplicateGroup = (groups: Group[]) => {
    const unique: Group[] = []
    groups.forEach(group => {
      if(!group) return
      const isDuplicate = unique.some( uniquePin => uniquePin.name === group?.name)
      if (!isDuplicate) unique.push(group as Group)
    });
    return unique
  }

  getPinGroup = (intersections: Intersection[]) => {
    const getParents = (_objs: Object3D[]) => objs.map( obj => obj.parent).filter( obj => Boolean(obj)) as Object3D[]
    const objs = intersections.map( intersection => intersection.object)
    const parents = getParents(objs)
    const groups = this.pinUtilsService.filterGroup(parents)
    const unique = this.filterDuplicateGroup(groups)
    return unique
  } 

  initCategory = async () => {
    const categoryId = await this.getCategoryIdFromRoute()
    const onGotCategorySettings = async (setting: CategorySetting) => {
      this.pins = await this.pinModelService.applyPinHeightFromSetting(setting, this.pins)
      await this.applySettings(setting)
    }
    await this.categoryService.getCategorySetting(categoryId, onGotCategorySettings)
  }

  applySettings = async (setting: CategorySetting) => this.guiColumnSettings = setting.options.meshSettings
  
  initOnUserUpdateResolution = () => {
    this.onUserUpdateCamera.pipe(
      switchMap(value => of(value).pipe(delay(1000))) // abandon too-frequent emission
    ).pipe(
      concatMap(() => this.queueToUpdateResolution.pipe(take(1))) // add emission to queue
    ).subscribe()
  }

  async ngAfterViewInit() {
    this.initThree()
    await this.initTile()
    await this.initCategory()
    this.updatePin3ds(this.pins, this.scene)
  }

  getCategoryIdFromRoute = async ():Promise<string> => {
    return new Promise( (resolve, reject) => {
      this.activatedRoute.paramMap.subscribe( param => {
        const id = param.get('id')
        if(!id) throw new Error("No param specified in router");
        resolve(id)
      })
    })
  }

  getBox = () => {
    const boxGeo = new BoxGeometry(5, 5, 5)
    const boxMaterial = new MeshBasicMaterial({ color: 0xff0000 })
    const box = new Mesh(boxGeo, boxMaterial)
    return box
  }

  initThree = () => {
    this.scene = this.sceneService.makeScene()
    this.renderer = this.rendererService.makeRenderer(this.canvasContainer, this.canvasDimention)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
    this.canvasContainer.nativeElement.addEventListener('mousewheel', this.onMouseScroll)
    this.canvasContainer.nativeElement.addEventListener('mouseup', this.onMouseUp)
    this.camera = this.cameraService.makeCamera(this.canvasDimention)
    this.scene.add(this.camera)
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.animateService.initAnimate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition)
    this.animateService.animate()
    this.box = this.getBox()
    this.plane = this.tileUtilsService.getPlane()
    this.plane.rotateX(-Math.PI * 0.5)
    this.plane.position.setY(-0.1)
    this.animateService.onFrameRender.subscribe(({ renderer, raycaster }) => {
    })
    this.lightService.makeLight(this.scene)
  }

  initTile = async () => {
    const tileIds = this.tileService.initTileIdsOfLevel8()
    const tiles = await this.tileUtilsService.getTileMeshById(tileIds)
    this.tileUtilsService.updateTileToRaycaster(tiles)
    this.tiles = tiles
    this.tileUtilsService.addTilesToScene(tiles, this.scene)
  }

  onMouseMove = async (event: MouseEvent) => {
    const newPosition = this.rendererService.updateMouse(event)
    this.mousePosition.set(newPosition.x, newPosition.y)
  }

  onMouseScroll = async () => {
    this.onUserUpdateCamera.next('')
  }

  onMouseUp = async () => {
    this.onUserUpdateCamera.next('')
  }

  updatePin3ds = (pins: Pin[], scene:Scene) => {
    this.removePins(pins)
    this.initPins(pins, scene, this.guiColumnSettings)
  }

  initPins = (pins: Pin[], scene: Scene, settings: Gui3dSettings) => {
    pins.forEach( pin => {
      // const pin = pins[0]
      if (!pin.positionLongLat) throw new Error("No Longitude or latitude");
      pin.position3d = this.longLatToPosition3d(pin.positionLongLat)
      const columnGroup = this.column3dService.createColumn3dLayers(pin, settings)
      this.animateService.passIntersetObject([columnGroup])
      
      pin.mesh = columnGroup      
      scene.add(columnGroup)
    })
  }

  removePins = (pins: Pin[]) => {
    pins.forEach( pin => {
      if (!pin.mesh) return
      pin.mesh.removeFromParent()
      this.animateService.removeIntersetObject(`pin`)
    })
  }

  longLatToPosition3d = (lonLat: Vector2) => {
    const long = lonLat.x
    const lat = lonLat.y
    const tileX = this.tileLonLatCalculation.lon2tile(long,8)
    const tileY = this.tileLonLatCalculation.lat2tile(lat,8)
    const scenePositionX = (tileX - this.tileUtilsService.initTileId.x) * 12
    const scenePositionY = (tileY - this.tileUtilsService.initTileId.y) * 12
    const position = new Vector3(scenePositionX, 0, scenePositionY)
    return position
  }

  pauseAnimation = () => {
    this.isPaused = true
    this.animateService.pauseAnimation()
  }

  resumeAnimation = () => {
    this.isPaused = false
    this.animateService.resumeAnimation()
    this.timeoutToPause()
  }

  timeoutToPause = () => {
    setTimeout(() => {
      this.pauseAnimation()
      console.log('animation paused');
    }, 20 * 1000);
  }


}
