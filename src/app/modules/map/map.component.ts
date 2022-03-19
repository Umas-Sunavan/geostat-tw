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
    const planGeo = new PlaneGeometry(size, size, size, size)
    const planMaterial = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide })
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
    await this.initTextureTile()
    await this.initHeightTile()
  }

  initHeightTile = async () => {
    const initTileId: TileId = {
      x: 212,
      y: 108,
      z: 8
    }
    const src = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${8}/${212}/${108}.pngraw?access_token=pk.eyJ1IjoidW1hc3Nzc3MiLCJhIjoiY2wwb3l2cHB6MHhwdDNqbnRiZnV1bnF5MyJ9.oh8mJyUQCRsnvOurebxe7w`
    this.getDataUrl(src , async (dataURL) => {
      const heightTexture = await this.getTextureByTextureLoader(dataURL)
      this.tilePlanes.forEach( tilePlane => {
        tilePlane.material.map = heightTexture
      })
    })
    
  }

  getDataUrl = (src:string, onGetUrl: (dataURL:string) => void) => {
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = this.createCanvasFromImage(img)
      const context = canvas.getContext("2d")
      if(!context) throw new Error("no context");
      const imageData = context.getImageData(0, 0, 256, 256)
      this.convertRawToHeight(imageData)
      context.putImageData(imageData, 0, 0)
      const dataURL = canvas.toDataURL('png');
      onGetUrl(dataURL);
    };
    img.src = src;
    if (img.complete || img.complete === undefined) {
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      img.src = src;
    }
  }

  convertRawToHeight = (imageData:ImageData) => {

    for (let i = 0; i < imageData.data.length; i+=4) {
      const r = imageData.data[i]
      const g = imageData.data[i+1]
      const b = imageData.data[i+2]
      const height = -10000 + ( (r * 256 * 256 + g * 256 + b) * 0.1)
      const normalHeight = (height) / 400
      const byteHeight = Math.floor(normalHeight * 256)
      imageData.data[i] = byteHeight
      imageData.data[i+1] = byteHeight
      imageData.data[i+2] = byteHeight
    }
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
    const planeGeo = new PlaneGeometry( 10, 10, 1, 1)
    return new THREE.Mesh( planeGeo, shaderMaterial );
  }

  initTextureTile = async () => {
    const initTileId: TileId = {
      x: 212,
      y: 108,
      z: 8
    }

    const tiles = this.getAllTilesFromLevel8(initTileId)
    for (const tileId of tiles) {
      const arrayBuffer = await this.tileService.getTextureBuffer(tileId);
      const base64 = this.arrayBufferToBase64(arrayBuffer)
      const texture = await this.getTextureByTextureLoader(base64)
      const tilePlane = this.getPlane(10)
      tilePlane.material.map = texture
      tilePlane.position.setX((tileId.x - initTileId.x) * 10)
      tilePlane.position.setZ((tileId.y - initTileId.y) * 10)
      tilePlane.rotateX(-Math.PI * 0.5)
      this.scene.add(tilePlane)
      this.tilePlanes.push(tilePlane)
    }
  }

  getAllTilesFromLevel8 = (initTileId: TileId) => {
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

  applyTexture = (texture: Texture, plane: Mesh<PlaneGeometry, MeshBasicMaterial>) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    plane.material.map = texture
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
    try {
      
    const texture = await textureLoader.loadAsync(base64);
    return texture
    } catch (error) {
      console.error(error);
      throw new Error(JSON.stringify(error));
      
    }
    
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
