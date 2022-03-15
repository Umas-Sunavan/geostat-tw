import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TileId } from 'src/app/shared/models/TileId';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane } from 'three';
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
    const planGeo = new PlaneGeometry(size, size, size)
    const planMaterial = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide })
    const plane = new Mesh(planGeo, planMaterial)
    return plane
  }

  initThree = () => {
    console.log(this.canvasContainer);

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
    this.initTextureTile()
    await this.initHeightTile()
  }

  initHeightTile = async () => {
    const initTileId: TileId = {
      x: 212,
      y: 108,
      z: 8
    }
    const arrayBuffer = await this.tileService.getHeightTile(initTileId);
    const base64 = this.arrayBufferToBase64(arrayBuffer)
    const texture = this.getTextureByTextureLoader(base64)
    const heightPlane = this.getPlane(10)
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const uniforms = {
      'amplitude': { value: 1.0 },
      'color': { value: new THREE.Color( 0xffffff ) },
      'colorTexture': { value: texture }
    };
    console.log(this.vertexshader, this.canvasContainer);
    
    const vertextShaderScript = this.vertexshader.nativeElement.textContent
    const fragmentShaderScript = this.fragmentshader.nativeElement.textContent
    if (vertextShaderScript && fragmentShaderScript) {
      console.log(vertextShaderScript , fragmentShaderScript);

      const shaderMaterial = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertextShaderScript,
        fragmentShader: fragmentShaderScript
      } );

      const planeGeo = new PlaneGeometry( 10, 10, 1, 1)
      const shaderPlane = new THREE.Mesh( planeGeo, shaderMaterial );
      // shaderPlane.material
      
      this.scene.add( shaderPlane );
    }




    heightPlane.rotateX(-Math.PI * 0.5)
    this.applyTexture(texture, heightPlane)
    this.scene.add(heightPlane)
    // heightPlane.material.map
  }

  initTextureTile = () => {
    const initTileId: TileId = {
      x: 212,
      y: 108,
      z: 8
    }

    const tiles = this.getAllTilesFromLevel8(initTileId)
    tiles.forEach( async tileId => {
      const arrayBuffer = await this.tileService.getTextureTile(tileId);
      const base64 = this.arrayBufferToBase64(arrayBuffer)
      const texture = this.getTextureByTextureLoader(base64)
      const tilePlane = this.getPlane(10)
      tilePlane.position.setX((tileId.x - initTileId.x) * 10)
      tilePlane.position.setZ((tileId.y - initTileId.y) * 10)
      tilePlane.rotateX(-Math.PI * 0.5)
      this.applyTexture(texture, tilePlane)
      this.scene.add(tilePlane)
    })
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

  getTextureByTextureLoader = (base64: string) => {
    return new THREE.TextureLoader().load(base64);
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
