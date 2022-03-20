import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TileId } from 'src/app/shared/models/TileId';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader } from 'three';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AnimateService } from './three-services/animate.service';
import { CameraService } from './three-services/camera.service';
import { LightService } from './three-services/light.service';
import { RendererService } from './three-services/renderer.service';
import { SceneService } from './three-services/scene.service';
import { TileService } from './tile-services/tile.service';
import { Tile } from 'src/app/shared/models/TileId copy';


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
  ) { }

  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fragmentshader') fragmentshader!: ElementRef<HTMLParagraphElement>;
  @ViewChild('vertexshader') vertexshader!: ElementRef<HTMLParagraphElement>;
  scene: Scene = new Scene()
  renderer: WebGLRenderer = new WebGLRenderer()
  camera: Camera = new PerspectiveCamera()
  orbitControl!: OrbitControls
  box?: Object3D
  box2?: Object3D
  ground!: Object3D
  mousePosition: Vector2 = new Vector2(0, 0)
  plane!: Object3D
  tilePlanes: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];

  ngOnInit(): void {
    console.log('this.canvasContainer');
  }

  async ngAfterViewInit() {
    console.log('this.canvasContainer');
    this.initThree()
    await this.initTile()
  }

  getBox = () => {
    const boxGeo = new BoxGeometry(5, 5, 5)
    const boxMaterial = new MeshBasicMaterial({ color: 0xff0000 })
    const box = new Mesh(boxGeo, boxMaterial)
    return box
  }

  getPlane = (size: number = 50) => {
    const planGeo = new PlaneGeometry(size, size, 100, 100)
    const planMaterial = new MeshStandardMaterial({ color: 0xffffff, side: DoubleSide })
    const plane = new Mesh(planGeo, planMaterial)
    return plane
  }

  initThree = () => {
    this.scene = this.sceneService.makeScene()
    this.renderer = this.rendererService.makeRenderer(this.canvasContainer)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
    this.camera = this.cameraService.makeCamera()
    this.scene.add(this.camera)
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.animateService.animate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition, 600)
    this.animateService.initAnimate(this.renderer)
    this.box = this.getBox()
    this.plane = this.getPlane()
    this.plane.rotateX(-Math.PI * 0.5)
    this.plane.position.setY(-0.1)
    this.scene.add(this.box)
    this.scene.add(this.plane)

    this.animateService.onFrameRender.subscribe(({ renderer, raycaster }) => {
      // console.log(this.camera.position);
      // this.camera.position
    })
    this.lightService.makeLight(this.scene)
    this.animateService.passIntersetObject([this.box])
  }

  onMouseMove = async (event: MouseEvent) => {
    const newPosition = this.rendererService.updateMouse(event)
    this.animateService.updateMouse(newPosition)
    this.mousePosition.set(newPosition.x, newPosition.y)
  }

  initTile = async () => {
    const initTileId: TileId = {
      x: 212,
      y: 108,
      z: 8
    }
    const tileIds = this.getTileIdsOfLevel8(initTileId)
    const tiles = tileIds.map( (id):Tile => {return {id: id,mesh: undefined}})
    this.initTileMesh(tiles, initTileId)
    await this.applyTexture(tiles)
    await this.applytHeightTile(tiles)
    this.addTilesToScene(tiles)
  }

  addTilesToScene = (tiles: Tile[]) => {
    tiles.forEach( tile => {
      if (!tile.mesh) throw new Error("no mesh to add to scene");
      const tile3d = tile.mesh as Object3D
      this.scene.add(tile3d)
    })
  }

  applytHeightTile = async (tiles: Tile[]) => {
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const onGetDataUrl = async (dataURL:string) => {
        if (!tile.mesh) throw new Error("no mesh to apply height texture");
        const heightTexture = await this.getTextureByTextureLoader(dataURL)
        tile.mesh.material.displacementMap = heightTexture
        tile.mesh.material.map = heightTexture
        tile.mesh.material.needsUpdate = true;
      }
      const src = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tile.id.z}/${tile.id.x}/${tile.id.y}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`
      const leftSrc = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tile.id.z}/${tile.id.x-1}/${tile.id.y}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`
      const topSrc = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tile.id.z}/${tile.id.x}/${tile.id.y-1}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`
      this.getDataUrl(src, leftSrc, topSrc , onGetDataUrl)
    }
    
  }

  getDataUrl = (src:string, leftSrc:string, topSrc:string, onGetUrl: (dataURL:string) => void) => {
    // to connect all edges, one should use neightbor tile's data
      this.loadImage( src, (imageData, canvas) => {
        this.loadImage( leftSrc, leftImageData => {
          this.loadImage( topSrc, topImageData => {
            this.convertRawToHeight(imageData, leftImageData, topImageData)
            const context = canvas.getContext("2d")
            if (!context) throw new Error("No Context!");
            context.putImageData(imageData, 0, 0)
            const dataURL = canvas.toDataURL('png');
            onGetUrl(dataURL);
          })
        })
      })
  }

  loadImage = (src:string, onImageLoaded: (imageData:ImageData, canvas: HTMLCanvasElement) => void) => {
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = this.createCanvasFromImage(img)
      const context = canvas.getContext("2d")
      if(!context) throw new Error("no context");
      const imageData = context.getImageData(0, 0, 256, 256)
      onImageLoaded(imageData, canvas)
    };
    img.src = src;
    if (img.complete || img.complete === undefined) {
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      img.src = src;
    }
  }

  convertRawToHeight = (imageData:ImageData, leftImageData: ImageData, topImapeData: ImageData) => {
    // use bottom edge height
    for (let x = 0; x < topImapeData.width; x++) {
      const bottomEdgePxPosition = this.getBottomEdgePxPosition(topImapeData, x)
      this.setupHeight(bottomEdgePxPosition, topImapeData, imageData, x, 0)
    }
    for (let y = 1; y < imageData.height; y++) {
      // use right edge height
      const rightEdgePxPosition = this.getRightEdgePxPosition(leftImageData, y)
      this.setupHeight(rightEdgePxPosition, leftImageData, imageData, 0, y)

      for (let x = 1; x < imageData.width; x++) {
          const pxPosition = (y * imageData.width + x)
          this.setupHeight(pxPosition, imageData, imageData, x, y)
      }      
    }
  }

  getRightEdgePxPosition = (tile: ImageData, y: number) => (tile.width) * (y+1) - 1

  getBottomEdgePxPosition = (tile: ImageData, x: number) => (tile.height - 1) * tile.width + x

  setupHeight = (pxPosition:number,sourceTile: ImageData, outputTile: ImageData, x:number, y:number) => {
    const height = this.getHeight(pxPosition, sourceTile)
    this.applytHeight(outputTile, x, y, height)
  }

  applytHeight = (imageData: ImageData, x: number, y: number, height: number) => {
    const colorPosition = (y * imageData.width + x) * 4
    imageData.data[colorPosition] = height
    imageData.data[colorPosition+1] = height
    imageData.data[colorPosition+2] = height
  }

  getHeight = (pxPosition: number, imageData: ImageData) => {
    const colorPosition = pxPosition * 4
    const r = imageData.data[colorPosition]
    const g = imageData.data[colorPosition+1]
    const b = imageData.data[colorPosition+2]
    const height = this.getHeightFromColors(r,g,b)
    return height
  }

  getHeightFromColors = (r: number, g: number, b: number) => {
    const height = -10000 + ( (r * 256 * 256 + g * 256 + b) * 0.1)
    // 1946.6 ~ -10.8
    const normalHeight = (height + 10.8) / 3800
    const byteHeight = Math.floor(normalHeight * 256)
    return byteHeight
  }

  createCanvasFromImage = (img: HTMLImageElement) => {
    const canvas: HTMLCanvasElement = document.createElement('CANVAS') as HTMLCanvasElement
    const context = canvas.getContext('2d')!;
    canvas.height = 256;
    canvas.width = 256;
    context.drawImage(img, 0, 0);
    return canvas
  }

  getShaderPlane = ( texture: Texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const uniforms = {
      'amplitude': { value: 1.0 },
      'color': { value: new THREE.Color( 0xffffff ) },
      'colorTexture': { value: texture }
    };
    const vertextShaderScript = this.vertexshader.nativeElement.textContent
    const fragmentShaderScript = this.fragmentshader.nativeElement.textContent
    if (!vertextShaderScript || !fragmentShaderScript) throw new Error("")
    const shaderMaterial = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertextShaderScript,
      fragmentShader: fragmentShaderScript
    } );
    const planeGeo = new PlaneGeometry( 10, 10, 20, 20)
    return new THREE.Mesh( planeGeo, shaderMaterial );
  }

  applyTexture = async (tiles: Tile[]) => {
    for (const tile of tiles) {
      const arrayBuffer = await this.tileService.getTextureBuffer(tile.id);      
      const base64 = this.arrayBufferToBase64(arrayBuffer)
      const texture = await this.getTextureByTextureLoader(base64)
      if (!tile.mesh) throw new Error("no mesh to apply texture!");
      tile.mesh.material.map = texture       
    }
  }

  initTileMesh = (tiles: Tile[], initTileId: TileId) => {
    for (const tile of tiles) {
      const mesh = this.getPlane(10)
      mesh.position.setX((tile.id.x - initTileId.x) * 10)
      mesh.position.setZ((tile.id.y - initTileId.y) * 10)
      mesh.rotateX(-Math.PI * 0.5)
      tile.mesh = mesh
    }
  }

  getTileIdsOfLevel8 = (initTileId: TileId) => {
    const tiles = []
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 5; y++) {
        const eachTileId = {
          x: initTileId.x + x,
          y: initTileId.y + y,
          z: initTileId.z
        }
        tiles.push(eachTileId)
      }
    }
    return tiles
  }

  getTextureByImageClass = (base64: string) => {
    const image = new Image();
    image.src = base64;
    const texture = new THREE.Texture();
    texture.image = image;
    image.onload = function () {
      texture.needsUpdate = true;
    };
    return texture
  }

  getTextureByTextureLoader = async (base64: string): Promise<Texture> => {    
    const textureLoader = new TextureLoader()
    return await textureLoader.loadAsync(base64);
  }

  arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8ClampedArray(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/jpg;base64,' + window.btoa(binary);
  }

}
