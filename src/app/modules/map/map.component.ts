import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TileId } from 'src/app/shared/models/TileId';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader, Intersection, CylinderGeometry, MeshMatcapMaterial } from 'three';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AnimateService } from './three-services/animate.service';
import { CameraService } from './three-services/camera.service';
import { LightService } from './three-services/light.service';
import { RendererService } from './three-services/renderer.service';
import { SceneService } from './three-services/scene.service';
import { TileService } from './tile-services/tile.service';
import { Tile } from 'src/app/shared/models/Tile';
import { TextureService } from './tile-services/texture.service';
import { BehaviorSubject, concatMap, delay, exhaustMap, filter, interval, last, lastValueFrom, map, Observable, of, Subject, Subscriber, switchMap, take, tap, timeout } from 'rxjs';
import { TileUtilsService } from './tile-services/tile-utils.service';
import { Point } from 'src/app/shared/models/Point';
import { TileLonglatCalculationService } from './tile-services/tile-longlat-calculation.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.sass']
})
export class MapComponent implements OnInit, AfterViewInit {

  constructor(
    private sceneService: SceneService,
    private rendererService: RendererService,
    private cameraService: CameraService,
    private animateService: AnimateService,
    private lightService: LightService,
    private tileService: TileService,
    private tileUtilsService: TileUtilsService,
    private tileLonLatCalculation: TileLonglatCalculationService
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
  points: Point[] = []
  

  initQueueToUpdateResolution = () => {
    this.queueToUpdateResolution = new Observable(subscriber => {
      this.tileService.updateTilesResolution(this.tiles, this.scene, this.camera).then(next => {
        this.tiles = next
        subscriber.next()
      })
    })
  }

  ngOnInit(): void {
    this.initOnUserUpdateResolution()
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
    await this.initTile()
    this.points.push( 
    {
      id: 1,
      height: 5,
      color: 0xff195d,
      title: 'title',
      address: 'address',
      position3d: new Vector3(20,0,30),
      positionTile: undefined,
      positionLongLat: new Vector2(121.54155193158469, 25.060983371449666),
      radius: 1
    },
    {
      id: 2,
      height: 5,
      color: 0xff195d,
      title: 'title',
      address: 'address',
      position3d: new Vector3(20,0,30),
      positionTile: undefined,
      positionLongLat: new Vector2(121.2871497245233, 25.01171859638522),
      radius: 1
    },
    {
      id: 3,
      height: 5,
      color: 0xff195d,
      title: 'title',
      address: 'address',
      position3d: new Vector3(20,0,30),
      positionTile: undefined,
      positionLongLat: new Vector2(121.6352790037705, 24.993671939788907),
      radius: 1
    },
    {
      id: 4,
      height: 5,
      color: 0xff195d,
      title: 'title',
      address: 'address',
      position3d: new Vector3(20,0,30),
      positionTile: undefined,
      positionLongLat: new Vector2(121.00113193826485, 24.802894365600768),
      radius: 1
    }
      )
    this.initPoints(this.points)
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
    this.animateService.animate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition, 600)
    this.animateService.initAnimate(this.renderer)
    this.box = this.getBox()
    this.plane = this.tileUtilsService.getPlane()
    this.plane.rotateX(-Math.PI * 0.5)
    this.plane.position.setY(-0.1)
    this.scene.add(this.box)
    this.scene.add(this.plane)

    this.animateService.onFrameRender.subscribe(({ renderer, raycaster }) => {
      // console.log(this.camera.position);
      // this.camera.position
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
    this.animateService.updateMouse(newPosition)
    this.mousePosition.set(newPosition.x, newPosition.y)
  }

  onMouseScroll = async () => {
    // this.onUserUpdateCamera.next('')
  }

  onMouseUp = async () => {
    // this.onUserUpdateCamera.next('')
  }

  initPoints = (points: Point[]) => {
    points.forEach( point => {
      if (!point.positionLongLat) throw new Error("No Longitude or latitude when converting to position 3D");
      point.position3d = this.longLatToPosition3d(point.positionLongLat)
      const columnGroup = this.getColumn3dLayers(point)
      this.scene.add(columnGroup)
    })
  }

  longLatToPosition3d = (lonLat: Vector2) => {
    const long = lonLat.x
    const lat = lonLat.y
    const tileX = this.tileLonLatCalculation.lon2tile(long,8)
    const tileY = this.tileLonLatCalculation.lat2tile(lat,8)
    const scenePositionX = (tileX - this.tileUtilsService.initTileId.x) * 12
    const scenePositionY = (tileY - this.tileUtilsService.initTileId.y) * 12
    console.log(scenePositionX, scenePositionY);
    const position = new Vector3(scenePositionX, 0, scenePositionY)
    return position
  }

  getColumn3dLayers = (point: Point) => {
    const group = new THREE.Group();
    const origionalMesh = this.getColumn3d(point, THREE.NormalBlending, false)
    const lightingMesh = this.getColumn3d(point, THREE.AdditiveBlending, false)
    const wireframe = this.getColumn3d(point, THREE.NormalBlending, true)
    group.add(origionalMesh)
    group.add(lightingMesh)
    group.add(wireframe)
    return group
  }

  getColumn3d = (point: Point, blending: any, wireframe: boolean):Mesh<CylinderGeometry, MeshPhongMaterial> => {
    if (!point.position3d) throw new Error("No Longitude or latitude when initing mesh");
    let material
    if (wireframe) {
      material = new MeshPhongMaterial( {
        transparent: true,
        opacity: 0.05,
        color: 0x000000,
        wireframe: true,
      })
    } else {
      material = new MeshPhongMaterial( {
        transparent: true,
        opacity: 0.2,
        color: point.color,
        blending: blending,
        side: DoubleSide
      })
    }
    const bottomRadius = point.radius
    const topRadius = point.radius
    const height = point.height
    const radialSegments = 18
    const heightSegments = 5
    const geometry = new CylinderGeometry( bottomRadius, topRadius, height, radialSegments, heightSegments, true, )
    const mesh = new Mesh(geometry, material)
    const normalizedHeight = point.position3d.y + height / 2
    mesh.position.set(point.position3d.x,normalizedHeight,point.position3d.z)
    return mesh
  }

}
