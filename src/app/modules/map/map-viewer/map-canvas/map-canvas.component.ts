import { AfterContentInit, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
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
  hoveredPins?: Pin[]
  hoverPinChangeSuject: BehaviorSubject<[]> = new BehaviorSubject([])
  font?: Font

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

  uiUpdatePin = (event: Event) => {
    this.updatePin3ds(this.pins, this.scene)
  }

  get3dMeshes = (pins: Pin[], meshName: string) => {
    const obj3ds:(Object3D | undefined)[] =  pins.map( pin => {
      return pin.mesh?.children.find( child => {
        return child.name.match(meshName)
      }) as Mesh
    });
    const solidObj3ds: Object3D[] = <Object3D[]>obj3ds.filter( pin => pin !== undefined)
    const meshes = solidObj3ds as Mesh<CircleGeometry, MeshPhongMaterial>[];
    return meshes
  }

  findPinModelById = (pins: Pin[], ids: string[]) =>  {
    return ids.map( id => {
      const found  =pins.find( pin => pin.id+'' === id)
      if (!found) throw new Error("the raycasted group object is not found in this.pins");
      return found
    })
  }

  getPinIdFromIntersections = (intersections: Intersection[]) => {
    const pinMeshGroups = this.getIntersectedPin(intersections)
    const intersectPinIds:string[] = []
    pinMeshGroups.forEach( pin => {
      const intersectMesh = pin.children.find( mesh => mesh.parent?.name.includes('group')) as Group
      const id = intersectMesh.parent?.name.match(/(?=.+_?)\d+/);
      if (id && id[0]) {
        intersectPinIds.push(id[0])
      }
    })
    return intersectPinIds
  }

  async ngOnInit(): Promise<void> {
    const loader = new FontLoader();        
    this.font = await loader.loadAsync( '/assets/helvetiker_regular.typeface.json');
    this.timeoutToPause()
    this.initOnUserUpdateResolution()
    this.animateService.onMouseIntersect.subscribe( intersections => {
      const ids = this.getPinIdFromIntersections(intersections)
      const pins = this.findPinModelById(this.pins, ids)
      this.onPinsHovered(pins)
    })
    this.pins = await this.pinModelService.initPinsModel()
    
    // this.pointDimensionService.writeUserData()
  }

  onPinsHovered = (pins:Pin[]) => {
    const isAnyPinHovered =pins.length > 0
    if (isAnyPinHovered) {
      const groups = this.getPin3ds(this.scene) as Group[]
      groups.forEach( group => {
        const oldPinColumn = this.getMeshGroupItem(group, 'column')
        const oldPinGround = this.getMeshGroupItem(group, 'ground')
        // oldPinColumn.material.opacity = this.guiColumnSettings.column.opacity
        // oldPinColumn.material.color = new Color(this.column3dService.parseStringColorToInt(this.guiColumnSettings.column.color))
        oldPinColumn.material.depthWrite  = true
        oldPinGround.material.depthWrite  = true
      })
    } else {
      const groups = this.getPin3ds(this.scene) as Group[]
      groups.forEach( group => {
        const oldPinColumn = this.getMeshGroupItem(group, 'column')
        const oldPinGround = this.getMeshGroupItem(group, 'ground')
        // oldPinColumn.material.opacity = this.guiColumnSettings.column.opacity
        // oldPinColumn.material.color = new Color(this.column3dService.parseStringColorToInt(this.guiColumnSettings.column.color))
        oldPinColumn.material.depthWrite  = false
        oldPinGround.material.depthWrite  = false
      })
    }
    console.log(pins?.map( pin => pin.id));
    pins = pins.slice(0,1)
    // const leftPins = this.hoveredPins?.filter( hoveredPin => !pins.find( pin => pin.id === hoveredPin.id)) || []
    this.hoveredPins?.forEach( pin => {
      const oldPinMeshGroup = this.getPin3dById(this.scene, pin.id+'')
      const oldPinColumn = this.getMeshGroupItem(oldPinMeshGroup, 'column')
      const oldPinGround = this.getMeshGroupItem(oldPinMeshGroup, 'ground')
      oldPinColumn.material.opacity = this.guiColumnSettings.column.opacity
      oldPinColumn.material.color = new Color(this.column3dService.parseStringColorToInt(this.guiColumnSettings.column.color))
      oldPinColumn.material.depthWrite  = false
      console.log(pin.id);
      // oldPinColumn.material.needsUpdate = true
    })
    this.hoveredPins = pins
    this.hoveredPins.forEach( pin => {
      const pinMeshGroup = this.getPin3dById(this.scene, pin.id+'')
      const pinColumn = this.getMeshGroupItem(pinMeshGroup, 'column')
      const pinGround = this.getMeshGroupItem(pinMeshGroup, 'ground')
      pinColumn.material.depthWrite  = true
      pinColumn.material.opacity = 0.6
      pinColumn.material.color = new Color(0xffff00)
      if (!this.font)return

      const material  = new MeshPhongMaterial( { color: 0xffffff } ) 
      const text  =new TextGeometry( 'text', {
        font: this.font,
        size: 8,
        height: 5,
        curveSegments: 12,
      }  );
      const textMesh1 = new Mesh( text, material );
      this.scene.add(textMesh1)
    })
  }

  getMeshGroupItem = (group: Group, selector: string) => group.children.find( child => child.name.includes(selector)) as Mesh<CylinderGeometry, MeshPhongMaterial>

  getPinModelById = (PinsModel:Pin[], id: string) => {
    const found = PinsModel.find( pin => pin.id+'' === id)
    if(!found) throw new Error("pin is not found by the provided id");
    return found
  }

  getPin3dById = (scene:Scene, id: string) => {
    const found = scene.children.find( child => {
      const token = new RegExp(`pin_group_${id}`)        
      return token.test(child.name)
    }) as Group
    if(!found) throw new Error("pin is not found by the provided id");
    return found
  }

  getPin3ds = (scene:Scene) => {
    return scene.children.filter( child => {
      const token = new RegExp(`pin_group_`)        
      return token.test(child.name)
    }) as Group[]
  }

  getIntersectedPin = (intersections: Intersection[]) => {
    const objs = intersections.map( intersection => intersection.object)
    const intersectPin = objs.map( obj => obj.parent).filter( parent => parent?.name.includes('group'))
    const uniquePins: Group[] = []
    intersectPin.forEach(pin => {
      if(!pin) return
      const isDuplicate = uniquePins.some( uniquePin => uniquePin.name === pin?.name)
      if (!isDuplicate) uniquePins.push(pin as Group)
    });
    return uniquePins
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
    const canvasDimention = new Vector2(600, 450)
    this.scene = this.sceneService.makeScene()
    this.renderer = this.rendererService.makeRenderer(this.canvasContainer, canvasDimention)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
    this.canvasContainer.nativeElement.addEventListener('mousewheel', this.onMouseScroll)
    this.canvasContainer.nativeElement.addEventListener('mouseup', this.onMouseUp)
    this.camera = this.cameraService.makeCamera(canvasDimention)
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
