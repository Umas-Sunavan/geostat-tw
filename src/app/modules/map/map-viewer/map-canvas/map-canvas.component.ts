import { AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader, Intersection, CylinderGeometry, MeshMatcapMaterial, CircleGeometry, Group, TOUCH, MOUSE, BufferAttribute, ShapePath } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BehaviorSubject, catchError, concatMap, delay, exhaustMap, filter, forkJoin, from, interval, last, lastValueFrom, map, mapTo, merge, mergeMap, Observable, of, Subject, Subscriber, switchMap, take, tap, timeout, timer } from 'rxjs';
import { CategorySetting, CategorySettings } from 'src/app/shared/models/CategorySettings';
import { ActivatedRoute } from '@angular/router';
import { PinCategoryMappingService } from './category/pin-category-mapping.service';
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
import { Pin, PinWithDnc } from 'src/app/shared/models/Pin';
import { CategoryService } from './category/category.service';
import { Gui3dSettings } from 'src/app/shared/models/GuiColumnSettings';
import { PinUtilsService } from './pin-services/pin-utils.service';
import { Polygon } from 'src/app/shared/models/Polygon';
import { GuiPolygonSettings } from 'src/app/shared/models/GuiPolygonSettings';
import { Polygon3dService } from './polygon-service/polygon-3d.service';
import { HttpMap } from 'src/app/shared/models/MapHttp';
import { MapHttpService } from 'src/app/shared/services/map-http/map-http.service';
import { environment } from 'src/environments/environment';
import { ClientPerformance } from 'src/app/shared/enums/clientPerformance';



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
    private categoryService: CategoryService,
    private activatedRoute: ActivatedRoute,
    private pinModelService: PinModelService,
    private pinUtilsService: PinUtilsService,
    private column3dService: Column3dService,
    private polygon3dService: Polygon3dService,
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
  hoveringPins: Pin[] = []
  hoverPinChangeSuject: BehaviorSubject<Pin[]> = new BehaviorSubject(([] as Pin[]))
  font!: Font
  @Output() hoverOnPin: EventEmitter<{ pin: Pin, legendPosition: Vector2 } | undefined> = new EventEmitter()
  canvasDimention = new Vector2(window.innerWidth, window.innerHeight)
  screenRatio = 2
  selectedPins: Pin[] = []
  polygons: Polygon[] = []
  defaultCategoryId: string = ''
  @Output() isLoadingTile: EventEmitter<boolean> = new EventEmitter()
  @Output() polygonUpdate: EventEmitter<Polygon[]> = new EventEmitter()
  @Output() cameraPositionCanReset: EventEmitter<boolean> = new EventEmitter()
  @Input() set onPinSelected(nextSelectedPins: Pin[] | undefined) {
    if (nextSelectedPins) {
      const deselectedPin = this.pinUtilsService.aFilterFromB(this.selectedPins, nextSelectedPins)
      this.selectedPins = nextSelectedPins
      this.hoveringPins = this.column3dService.updatePinsStyle([], this.guiColumnSettings, deselectedPin, this.selectedPins)
      this.updatePolygons();
      setTimeout(() => {
        this.onCameraChange()
      }, 0);
    } else {
      console.warn("no pin selected when updating canvas");
    }
  }
  selectedPinsWithDnc: PinWithDnc[] = []
  debugMode = !environment.production
  @Output() selectedPinsWithDncEmitter: EventEmitter<PinWithDnc[]> = new EventEmitter<PinWithDnc[]>()
  // view
  guiPolygonSettings: GuiPolygonSettings = {
    color: '#528bff',
    opacity: 0.6
  }
  guiColumnSettings: Gui3dSettings = this.categoryService.mockSetting.options.meshSettings

  initQueueToUpdateResolution = () => {
    this.queueToUpdateResolution = new Observable(subscriber => {
      this.isLoadingTile.emit(true)
      this.tileService.updateTilesResolution(this.tiles, this.scene, this.camera).then(next => {
        this.tiles = next
        subscriber.next()
        this.isLoadingTile.emit(false)
      })
    })
  }

  uiUpdatePin = (event: Event) => {
    console.log('pin updated');

    this.pinModelService.updatePin3ds(this.pins, this.scene, this.guiColumnSettings)
    this.column3dService.updatePinsStyle(this.hoveringPins, this.guiColumnSettings, [], this.selectedPins)
  }

  async ngOnInit(): Promise<void> {
    this.hoverPinChangeSuject.subscribe(nextHoverPins => {
      this.hoveringPins = this.column3dService.updatePinsStyle(nextHoverPins, this.guiColumnSettings, this.hoveringPins, this.selectedPins)
      nextHoverPins = this.hoveringPins
    })
    this.timeoutToPause()
    this.initOnUserUpdateResolution()
    if(this.animateService.onMouseIntersectSubscription) {
      this.animateService.onMouseIntersectSubscription.unsubscribe()
    }
    this.animateService.onMouseIntersectSubscription = this.animateService.onMouseIntersect.subscribe(intersections => this.onMouseIntersect(intersections))

    
    // this.pins = await this.pinModelService.initPinsModel()

    // this.pointDimensionService.writeUserData()
  }

  onMouseIntersect = (intersections: Intersection[]) => {
    const pinIds = this.pinUtilsService.getPinIdsFromIntersections(intersections)
    const pins = this.pinUtilsService.findPinById(this.pins, pinIds)
    this.changeLegendText(pins[0])
    this.onPinsHovered(pins)
  }

  onPinsHovered = (pins: Pin[]) => {
    pins = pins.slice(0, 1)
    const groups = this.pinUtilsService.mappingToGroups(pins) as Group[]
    const isAnyPinHovered = pins.length > 0
    this.column3dService.setDepthWrite(groups, isAnyPinHovered, ['column', 'ground'])
    const isChanged = !this.pinUtilsService.isSamePins(this.hoveringPins || [], pins)
    if (isChanged) {
      this.hoverPinChangeSuject.next(pins)
    }
  }

  changeLegendText = (pin?: Pin) => {
    if (pin) {
      // this.mousePosition.x: -1~1
      // this.mousePosition.y: 1~-1
      const htmlAbsolutePosition = this.getPositionOnHtml(this.mousePosition, this.canvasDimention)
      this.hoverOnPin.emit({ pin: pin, legendPosition: htmlAbsolutePosition })
    } else {
      this.hoverOnPin.emit()
    }
  }

  getPositionOnHtml = (mousePosition: Vector2, canvasDomention: Vector2) => {
    const x = (mousePosition.x + 1) / 2 * canvasDomention.x // mousePosition.x: -1~1, which should map to canvas left(0) to right(600)
    const y = (mousePosition.y - 1) / 2 * canvasDomention.y // mousePosition.y: 1~-1, which should map to canvas top(0) to bottom(-450)
    return new Vector2(x, y)
  }

  appendUrlStatusCode = (setting: CategorySetting) => {
    console.log(setting);
    return this.categoryService.getCategoryTableByUrl(`https://docs.google.com/spreadsheets/d/${setting.tableSource}/gviz/tq?`).pipe( map(code => {
      setting.valid = Boolean(code === 200)
      return setting
    }))
  }

  applySettings = (setting: CategorySetting) => {
    this.guiColumnSettings = setting.options.meshSettings
    this.guiPolygonSettings = setting.options.meshSettings.polygon
  }

  initOnUserUpdateResolution = () => {
    this.onUserUpdateCamera.pipe(
      switchMap(value => of(value).pipe(delay(1000))) // abandon too-frequent emission
    ).pipe(
      concatMap(() => this.queueToUpdateResolution.pipe(take(1))) // add emission to queue
    ).subscribe()
  }

  async ngAfterViewInit() {
    this.initThree()
    this.canvasContainer.nativeElement.addEventListener('mousewheel', this.onMouseScroll)
    this.canvasContainer.nativeElement.addEventListener('click', this.onMouseClick)
    // this.pinTableSource = this.pinModelService.getPinTableSource(mapId)
    this.pins = await this.pinModelService.initPinsModel('1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM')
    this.onCategoryChageFromPicker(this.defaultCategoryId) // init after pins ready
    await this.initTile()
  }

  @Input() onCategoryChageFromPicker = async (categoryId: string) => {  
    this.pinModelService.removePins(this.pins)
    // this.pinTableSource = this.pinModelService.getPinTableSource(mapId)
    this.pins = await this.pinModelService.initPinsModel('1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM')
    this.defaultCategoryId = categoryId
    if(!categoryId) return
    this.categoryService.getCategorySetting(categoryId).pipe( 
      take(1),
      mergeMap( setting => this.appendUrlStatusCode(setting)),
      mergeMap( setting => this.pinModelService.applyPinHeightFromSetting(setting, this.pins))
    ).subscribe( (settingAndPins: {setting: CategorySetting;pins: Pin[]}|undefined) => {
        if (!settingAndPins) {
          alert('資料來源錯誤。請確保其Google Sheet已設為公開')
          return
        }
        this.pins = settingAndPins.pins
        this.applySettings(settingAndPins.setting)
        this.pinModelService.updatePin3ds(this.pins, this.scene, settingAndPins.setting.options.meshSettings)      
      })
  }

  getCategoryIdFromRouteAsync = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.activatedRoute.paramMap.subscribe(param => {
        const mapId = param.get('id')
        if (!mapId) throw new Error("No param specified in router");
        resolve(mapId)
      })
    })
  }

  getCategoryIdFromRoute = (): Observable<string> => {
    return this.activatedRoute.paramMap.pipe( map( param => {
      const mapId = param.get('id')
      if (!mapId) throw new Error("No param specified in router");
      return mapId
    }))
  }

  getBox = (size: number = 5) => {
    const boxGeo = new BoxGeometry(size, size, size)
    const boxMaterial = new MeshPhongMaterial({ color: 0xff0000 })
    const box = new Mesh(boxGeo, boxMaterial)
    return box
  }

  initThree = () => {
    this.scene = this.sceneService.makeScene()
    this.renderer = this.rendererService.makeRenderer(this.canvasContainer, this.canvasDimention)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
    this.camera = this.cameraService.makeCamera(this.canvasDimention)
    this.scene.add(this.camera)
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.resetPosition()
    this.orbitControl.screenSpacePanning = false
    this.orbitControl.update()
    this.orbitControl.listenToKeyEvents(window as any)
    this.orbitControl.keys = {
      LEFT: 'ArrowLeft', //left arrow
      UP: 'ArrowUp', // up arrow
      RIGHT: 'ArrowRight', // right arrow
      BOTTOM: 'ArrowDown' // down arrow
    }
    this.orbitControl.touches = {
      ONE: TOUCH.PAN,
      TWO: TOUCH.ROTATE,
    }
    this.orbitControl.mouseButtons = {
    LEFT: MOUSE.PAN,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.ROTATE
    }
    this.orbitControl.maxDistance = 100
    // @ts-ignore
    if(!navigator.userAgentData.mobile) this.orbitControl.enableDamping = true
    this.orbitControl.maxPolarAngle = Math.PI * 0.5 - 0.1
    this.orbitControl.addEventListener('change', this.onCameraChange)
    this.animateService.initAnimate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition)
    this.animateService.animate()
    this.box = this.getBox()
    this.plane = this.tileUtilsService.getPlane()
    this.plane.rotateX(-Math.PI * 0.5)
    this.plane.position.setY(-0.1)
    this.animateService.onFrameRender.subscribe(({ renderer, raycaster }) => {
    })
    this.lightService.makeLights(this.scene)

    setTimeout(() => {
      const performance = this.rendererService.chechClientPerformance()
      if (performance === ClientPerformance.HIGH) {
        this.renderer = new WebGLRenderer({ antialias: true, precision: "highp" })
      }
      if (performance === ClientPerformance.MEDIUM) {
        this.renderer = new WebGLRenderer({ antialias: false, precision: "lowp" })
      }
      console.log('apply performance: ', performance);
    }, 6000);
  }

  initTile = async () => {
    this.isLoadingTile.emit(true)
    const tileIds = this.tileService.initTileIdsOfLevel8()
    const tiles = await this.tileUtilsService.getTileMeshById(tileIds)
    this.tileUtilsService.updateTileToRaycaster(tiles)
    this.tiles = tiles
    this.tileUtilsService.addTilesToScene(tiles, this.scene)
    this.isLoadingTile.emit(false)
  }

  onMouseMove = async (event: MouseEvent) => {
    const newPosition = this.rendererService.updateMouse(event)
    this.mousePosition.set(newPosition.x, newPosition.y)
  }

  onMouseScroll = async () => {
    this.onUserUpdateCamera.next('')
  }

  onMouseClick = async () => {
    const isHoveringPins = this.hoveringPins && this.hoveringPins[0]
    if (isHoveringPins) {
      const clickedPin = this.hoveringPins![0]
      this.selectedPins = this.pinModelService.updateSelectedPins(clickedPin, this.selectedPins)
      this.updatePolygons()
      this.changePinStyleOnClick(clickedPin)
      this.onCameraChange()
    }
    this.onUserUpdateCamera.next('')
  }

  updatePolygons = () => {
    this.polygons = this.polygon3dService.removePolygons(this.polygons)
    const { models, meshes } = this.polygon3dService.createPolygons(this.selectedPins, this.guiPolygonSettings)
    this.polygons.push(...models)
    this.polygonUpdate.emit(this.polygons)
    meshes.forEach(mesh => this.scene.add(mesh))
  }

  showUnprojectPosition = (camera: Camera, shaderCoordinate: Vector3) => {
    const reversed = this.pinUtilsService.testUnproject(camera, new Vector3(shaderCoordinate.x, shaderCoordinate.y, shaderCoordinate.z))
    const box = this.getBox(3)
    box.position.set(reversed.x, reversed.y, reversed.z)
    this.scene.add(box)
  }

  changePinStyleOnClick = (pin: Pin) => {
    const clickedGroup = pin.mesh
    if (!clickedGroup) return
    const column = this.pinUtilsService.getPinMeshInGroup(clickedGroup, 'column')
    column.material.color = new Color(0x000000)
  }

  onCameraChange = () => {
    this.selectedPinsWithDnc = this.pinUtilsService.getPinsDnc(this.selectedPins, this.canvasDimention, this.camera)
    this.selectedPinsWithDncEmitter.emit(this.selectedPinsWithDnc)
    this.orbitControl.target.setY(0)
    this.cameraPositionCanReset.emit(true)
    
  }

  uiUpdatePolygon = (event: Event) => {
    this.updatePolygons()
    console.log('update');

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
    if (this.debugMode) {
      setTimeout(() => {
        this.pauseAnimation()
      }, 20 * 1000);
    }
  }

  resetPosition = () => {
    this.orbitControl.target.set(21.27, 0, 30.53)
    this.camera.position.set(...this.cameraService.defaultCameraPosition)
    this.cameraPositionCanReset.emit(false)
  }

}
