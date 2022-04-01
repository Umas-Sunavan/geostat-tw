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
import { BehaviorSubject, concatMap, delay, exhaustMap, filter, forkJoin, from, interval, last, lastValueFrom, map, mapTo, merge, mergeMap, Observable, of, Subject, Subscriber, switchMap, take, tap, timeout, timer } from 'rxjs';
import { TileUtilsService } from './tile-services/tile-utils.service';
import { Point } from 'src/app/shared/models/Point';
import { TileLonglatCalculationService } from './tile-services/tile-longlat-calculation.service';
import { GoogleSheetRawData } from 'src/app/shared/models/GoogleSheetRawData';
import { HttpClient } from '@angular/common/http';
import { GeoencodingRaw } from 'src/app/shared/models/Geoencoding';
import { AddressTitleMapping } from 'src/app/shared/models/AddressTitleMapping';
import { GeoencodingTitleMapping } from 'src/app/shared/models/GeoencodingTitleMapping';
import { LonLatTitleMapping } from 'src/app/shared/models/AddressTitleMapping copy';


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
    private tileLonLatCalculation: TileLonglatCalculationService,
    private httpClient: HttpClient,
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
    this.getGoogleSheetInfo().subscribe( next => {
      console.log(next);
      
    })
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

  getGoogleSheetInfo = (googeSheetId: string = '1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM'): Observable<LonLatTitleMapping[]> => {
    console.log('googeSheetId: ', googeSheetId);
    const options = {
      responseType: 'text' as 'json',
    };
    return this.httpClient.get<GoogleSheetRawData>(`https://docs.google.com/spreadsheets/d/1vRdclyzCMhaoO23Xv81zbfmcLZQ9sKFrOwlkZFmozXM/gviz/tq?`, options).pipe(
      this.convertGoogleSheetToAddress,
      this.convertAddressToRawGeoencoding,
      this.convertGoogleGeoencodingToLonLat,
      tap( value => console.log(value))
      // this.filterMalfunctionStation,
      // this.averageHeightInDuplicateDistrict,
      // this.averageToneInDuplicateDistrict,
      // this.filterDuplicatedDistrict,
    )
  }

  convertGoogleGeoencodingToLonLat = map( (geometries: GeoencodingTitleMapping[]): LonLatTitleMapping[] => {
      return geometries.map( eachGeometry => {
        const location = eachGeometry.raw.results[0].geometry.location
        return {lonLat: new Vector2(location.lat, location.lng), title: eachGeometry.title}
      })
  })

  convertAddressToRawGeoencoding = mergeMap( (next: AddressTitleMapping[]): Observable<GeoencodingTitleMapping[]>=> {
      let allRequests = next.map(({title, address}) => {
        const encodedAddress = encodeURIComponent(address)
        const request = this.getGeoLonLat(encodedAddress, title)
        return request
      });
      const groups = this.groupRequest(allRequests)
      return from(groups).pipe( concatMap( forEachGroup => forkJoin(forEachGroup)))
  })

  groupRequest = (rqs:Observable<{raw: GeoencodingRaw, title: string}>[]): Observable<{raw: GeoencodingRaw, title: string}>[][] => {
    const groups = []        
    for (let i = 0; i < rqs.length; i+=10) {
      const emptyGroup = new Array(10).fill(i)
      const mappedGroup = emptyGroup.map( (groupId, index) => rqs[groupId + index])
      const solidGroup = mappedGroup.filter( (rq) => Boolean(rq) )
      groups.push(solidGroup)
    }
    return groups
  }

  getGeoLonLat = (address: string, title: string): Observable<{raw: GeoencodingRaw, title: string}> => {
    return this.httpClient.get<GeoencodingRaw>(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAAQr-IWEpmXbcOk3trYWMMcasLuIBZ280`)
    .pipe( map( next => {return {raw: next, title: title}}))
  }

  getMockGeoLonLat = (address: string, title: string): Observable<{raw: GeoencodingRaw, title: string}> => {
    let randomDelay = Math.floor(Math.random()*5000)
    return of(
      {"results": [
        {
            "address_components": [
                {
                    "long_name": "2樓",
                    "short_name": "2樓",
                    "types": [
                        "subpremise"
                    ]
                },
                {
                    "long_name": "3號",
                    "short_name": "3號",
                    "types": [
                        "street_number"
                    ]
                },
                {
                    "long_name": "Beiping West Road",
                    "short_name": "Beiping W Rd",
                    "types": [
                        "route"
                    ]
                },
                {
                    "long_name": "黎明里",
                    "short_name": "黎明里",
                    "types": [
                        "administrative_area_level_4",
                        "political"
                    ]
                },
                {
                    "long_name": "Zhongzheng District",
                    "short_name": "Zhongzheng District",
                    "types": [
                        "administrative_area_level_3",
                        "political"
                    ]
                },
                {
                    "long_name": "Taipei City",
                    "short_name": "Taipei City",
                    "types": [
                        "administrative_area_level_1",
                        "political"
                    ]
                },
                {
                    "long_name": "Taiwan",
                    "short_name": "TW",
                    "types": [
                        "country",
                        "political"
                    ]
                },
                {
                    "long_name": "100",
                    "short_name": "100",
                    "types": [
                        "postal_code"
                    ]
                }
            ],
            "formatted_address": "100, Taiwan, Taipei City, Zhongzheng District, Beiping W Rd, 3號2樓",
            "geometry": {
                "location": {
                    "lat": 25.0477467,
                    "lng": 121.5169983
                },
                "location_type": "ROOFTOP",
                "viewport": {
                    "northeast": {
                        "lat": 25.0490956802915,
                        "lng": 121.5183472802915
                    },
                    "southwest": {
                        "lat": 25.04639771970849,
                        "lng": 121.5156493197085
                    }
                }
            },
            "place_id": "ChIJxeVZh3KpQjQR0ESgIfL9Ug0",
            "types": [
                "subpremise"
            ]
        }
      ],
        "status": "OK"
      } as GeoencodingRaw).pipe( delay(randomDelay), map( next => {return {raw: next, title: title}}))
  }
  
  convertGoogleSheetToAddress = map((rawdata): AddressTitleMapping[] => {
    rawdata = this.removeExtraText(rawdata as string)    
    const raw = <GoogleSheetRawData>JSON.parse(rawdata as string)    
    const titleandAddress: any[] = raw.table.rows
      .filter((row, index) => row.c[0]?.v !== '落點名稱')
      .map((row, index) => {
        let title = ""
        let address = ""
        if (row.c) {
          title = row.c[0].v
          address = row.c[1].v
        } 
        return {
          title,
          address,
        }
      })
    return titleandAddress
  })

  removeExtraText = (text:string) => {
    const tokenToReplaceOnStart = `/*O_o*/\ngoogle.visualization.Query.setResponse(`
    const tokenToReplaceOnend = `);`
    return text.replace(tokenToReplaceOnStart, '').replace(tokenToReplaceOnend, '')
  }


}
