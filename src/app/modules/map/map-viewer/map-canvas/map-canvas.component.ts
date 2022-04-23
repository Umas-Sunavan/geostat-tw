import { AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader, Intersection, CylinderGeometry, MeshMatcapMaterial, CircleGeometry, Group, TOUCH, MOUSE } from 'three';
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
import { Pin, PinWithDnc } from 'src/app/shared/models/Pin';
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
  @Output() selectedPinsOnGui: EventEmitter<PinWithDnc[]> = new EventEmitter()
  canvasDimention = new Vector2(600, 450)
  screenRatio = 2
  selectedPins: Pin[] = []

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

  uiUpdatePin = (event: Event) => this.pinModelService.updatePin3ds(this.pins, this.scene, this.guiColumnSettings)

  async ngOnInit(): Promise<void> {
    this.hoverPinChangeSuject.subscribe( nextHoverPins => {

      console.log(nextHoverPins);
      this.hoveringPins = this.column3dService.updateHoverPins(nextHoverPins, this.guiColumnSettings, this.hoveringPins, this.selectedPins)
    })
    this.timeoutToPause()
    this.initOnUserUpdateResolution()
    this.animateService.onMouseIntersect.subscribe( intersections => this.onMouseIntersect(intersections))
    this.pins = await this.pinModelService.initPinsModel()
    
    // this.pointDimensionService.writeUserData()
  }

  onMouseIntersect = (intersections: Intersection[]) => {
    const pinIds = this.pinUtilsService.getPinIdsFromIntersections(intersections)
    const pins = this.pinUtilsService.findPinById(this.pins, pinIds)
    this.changeLegendText(pins[0])
    this.onPinsHovered(pins)
  }

  onPinsHovered = (pins:Pin[]) => {
    pins = pins.slice(0,1)
    const groups = this.pinUtilsService.mappingToGroups(pins) as Group[]
    const isAnyPinHovered =pins.length > 0
    this.column3dService.setDepthWrite(groups, isAnyPinHovered, ['column', 'ground'])
    const isChanged = !this.pinUtilsService.isSamePins(this.hoveringPins || [], pins)
    if(isChanged) {
      this.hoverPinChangeSuject.next(pins)
    }
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

  getPositionOnHtml = (mousePosition: Vector2, canvasDomention: Vector2) => { 
    const x = (mousePosition.x + 1) / 2 * canvasDomention.x // mousePosition.x: -1~1, which should map to canvas left(0) to right(600)
    const y = (mousePosition.y - 1) / 2 * canvasDomention.y // mousePosition.y: 1~-1, which should map to canvas top(0) to bottom(-450)
    return new Vector2(x,y)
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
    this.canvasContainer.nativeElement.addEventListener('mousewheel', this.onMouseScroll)
    this.canvasContainer.nativeElement.addEventListener('click', this.onMouseClick)
    await this.initTile()
    await this.initCategory()
    this.pinModelService.updatePin3ds(this.pins, this.scene, this.guiColumnSettings)

    const box = this.getBox(5)
    const camera = this.camera
    this.scene.add(box)
    const projected = this.testProject(camera, box.position)
    console.log(projected.x, projected.y);
    
  }

  testProject = (camera: Camera, positionToPrject: Vector3) => {
    const canvasW = 600, canvasH = 450
    const canvasWHalf = canvasW / 2, canvasHHalf = canvasH / 2;
    const shaderCoordinate = positionToPrject.clone().project(camera); // returns a shader-like coordinate position
    const x = ( shaderCoordinate.x * canvasWHalf ) + canvasWHalf;
    const y = - ( shaderCoordinate.y * canvasHHalf ) + canvasHHalf;
    const dncCoordinate = new Vector2(x,y)
    return dncCoordinate
  }

  testUnproject = (camera: Camera, dnc: Vector3) => {
    const shaderPosition = dnc
    shaderPosition.unproject(this.camera); // -1~1 => -screen width/2~screen width/2
    const normalUnprojection = new Vector3().subVectors(shaderPosition, camera.position).normalize(); // normalize to (0~1,0~1,0~1) position and move the the world center
    const distance = ( 0 - camera.position.z ) / normalUnprojection.z;
    normalUnprojection.multiplyScalar(distance) // move the box position towards the direction at which camera.position looks
    const pos = new Vector3().copy(camera.position).add(normalUnprojection); // currently the position is moved from the world center. the actuall position should be moved from the camera
    return pos
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

  getBox = (size: number = 5) => {
    const boxGeo = new BoxGeometry(size, size, size)
    const boxMaterial = new MeshBasicMaterial({ color: 0xff0000 })
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
    this.orbitControl.target.set(0,5,50)
    this.orbitControl.update()
    this.orbitControl.listenToKeyEvents(window as any)
    // this.orbitControl.getDistance()
    this.orbitControl.keys = {
      LEFT: 'ArrowLeft', //left arrow
      UP: 'ArrowUp', // up arrow
      RIGHT: 'ArrowRight', // right arrow
      BOTTOM: 'ArrowDown' // down arrow
    }
    this.orbitControl.touches = {
      ONE: TOUCH.DOLLY_PAN,
      TWO: TOUCH.ROTATE,
    }
    // this.orbitControl.mouseButtons = {
      // LEFT: MOUSE.PAN,
      // MIDDLE: MOUSE.DOLLY,
      // RIGHT: MOUSE.ROTATE
    // }
    // this.orbitControl.maxDistance = 100
    // this.orbitControl.enableDamping = true
    this.orbitControl.addEventListener('change', this.onCameraChange)
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

  onMouseClick = async () => {
    const isHoveringPins = this.hoveringPins && this.hoveringPins[0]
    if (isHoveringPins) {
      const clickedPin = this.hoveringPins![0]
      this.selectedPins = this.updateSelectedPins(clickedPin, this.selectedPins)
      this.changePinStyleOnClick(clickedPin)
      this.onCameraChange()
    }
    this.onUserUpdateCamera.next('')
  }

  changePinStyleOnClick = (pin: Pin) => {
    const clickedGroup = pin.mesh
    if (!clickedGroup) return
    const column = this.pinUtilsService.getPinMeshInGroup(clickedGroup, 'column')
    column.material.color = new Color(0x000000)
  }

  onCameraChange = () => {
    const pinsWithDnc = this.getPinsDnc(this.selectedPins)
    this.selectedPinsOnGui.emit(pinsWithDnc)
  }

  getPinsDnc = (pins: Pin[]) => {
    const sahderCoordXToDncX = (shaderCoordX: number, canvasW: number) => (shaderCoordX + 1) / 2 * canvasW 
    const sahderCoordXToDncY = (shaderCoordY: number, canvasH: number) => (-shaderCoordY + 1) / 2 * canvasH
    const pinsWithDnc: PinWithDnc[] = pins.map( pin => {
      if(!pin.position3d) throw new Error("no position in selected pin");
      const shaderCoordinate = pin.position3d.clone().project(this.camera)
      // TERMINOLOGY: DNC is the pixel coordinate on the canvas DOM
      const dncX = sahderCoordXToDncX(shaderCoordinate.x, this.canvasDimention.x)
      const dncY = sahderCoordXToDncY(shaderCoordinate.y, this.canvasDimention.y)
      const pinWithDnc:PinWithDnc = { ... pin, deviceCoordinate: new Vector2(dncX, dncY) }
      return pinWithDnc
    })
    return pinsWithDnc
  }

  showUnprojectPosition = (shaderCoordinate: Vector3) => {
    const reversed = this.testUnproject(this.camera, new Vector3(shaderCoordinate.x, shaderCoordinate.y, shaderCoordinate.z))
    const box = this.getBox(3)
    box.position.set(reversed.x, reversed.y, reversed.z)
    this.scene.add(box)
  }

  updateSelectedPins = (pinClicked: Pin, alreadySelectedPins: Pin[]) => {
    const isClickedPinSelected =  alreadySelectedPins.some( pinOnHold => pinOnHold.id === pinClicked.id)
    let updatedPins: Pin[] = []
    if (isClickedPinSelected) {
      // Deselect
      updatedPins =  alreadySelectedPins.filter( pin => pin.id !== pinClicked.id)
    } else {
      // Select
      updatedPins = [...alreadySelectedPins, pinClicked]
    }
    return updatedPins
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
