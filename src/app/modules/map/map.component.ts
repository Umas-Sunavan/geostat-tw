import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TileId } from 'src/app/shared/models/TileId';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader, Intersection } from 'three';
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
import { filter, last, lastValueFrom } from 'rxjs';
import { TileDistanceMap } from 'src/app/shared/models/TileDistanceMap';


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
    private textureService: TextureService,
  ) { }

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

  // attribute to display on HTML
  nearestTileId: string = '{x: 0, y: 0, z:0}'
  nearestTileDistance: number = 0
  currentRoughTiles: Tile[] = []
  removedTiles:  { time: string, tileId:TileId[]}[] = []
  addedTiles: { time: string, tileId:TileId[]}[] = []

  ngOnInit(): void {
  }

  async ngAfterViewInit() {
    this.initThree()
    await this.initTile()
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
    this.camera = this.cameraService.makeCamera(canvasDimention)
    this.scene.add(this.camera)
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.animateService.animate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition, 3600)
    this.animateService.initAnimate(this.renderer)
    this.box = this.getBox()
    this.plane = this.tileService.getPlane()
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

  onMouseMove = async (event: MouseEvent) => {
    const newPosition = this.rendererService.updateMouse(event)
    this.animateService.updateMouse(newPosition)
    this.mousePosition.set(newPosition.x, newPosition.y)
  }

  initTile = async () => {
    const initTileId = this.tileService.initTileId
    const tileIds = this.tileService.getTileIdsOfLevel8(initTileId)
    this.tiles = tileIds.map( (id):Tile => {return {id: id,mesh: undefined}})
    this.tileService.initTileMesh(this.tiles, initTileId)
    const objToDetectIntersect = this.tiles.map( tile => tile.mesh as Object3D)
    this.animateService.passIntersetObject(objToDetectIntersect)
    await this.textureService.applyTexture(this.tiles)
    await this.textureService.applyDisplacementTexture(this.tiles)
    this.addTilesToScene(this.tiles)
  }

  addTilesToScene = (tiles: Tile[]) => {
    tiles.forEach( tile => {
      if (!tile.mesh) throw new Error("no mesh to add to scene");
      const tile3d = tile.mesh as Object3D      
      this.scene.add(tile3d)
    })
  }

  addDetailTileOnHtml = async (roughTiles: Tile[]) => {
    const newTiles = this.getDetailedTile(roughTiles)
    this.tiles.push( ...newTiles)
    this.tileService.initTileMesh(newTiles, this.tileService.initTileId)
    // add new mesh so it needs to be updated
    const objToDetectIntersect = this.tiles.map( tile => tile.mesh as Object3D)
    this.animateService.passIntersetObject(objToDetectIntersect)

    // await this.textureService.applyTexture(newTiles)
    this.textureService.applyMockTexture(newTiles)
    this.addTilesToScene(newTiles)
    this.addedTiles.push({time: new Date().toISOString(), tileId: newTiles.map( tile => tile.id)})
  }

  removeRoughTileOnHtml = async (roughTiles: Tile[]) => {
    this.removeRoughTile(roughTiles)
    this.removedTiles.push({time: new Date().toISOString(), tileId: roughTiles.map( tile => tile.id)})
  }

  onMouseScroll = async () => {
    const roughTile:Tile[] = await this.tileNominatedToTrunDetail()
    this.currentRoughTiles = roughTile
    try {
      await this.removeRoughTileOnHtml(this.currentRoughTiles)
      await this.addDetailTileOnHtml(this.currentRoughTiles)
    } catch (error) {
      console.warn('abandon removing ', this.currentRoughTiles.map( tile => JSON.stringify(tile.id)).join(', '));
      
    }
  }

  hasEnoughDetailedTiles = (maxHighResolutionTileCount: number) => {
    const resolutions:number[] = this.tiles.map( tile => tile.id.z)
    const sortResolution = resolutions.sort((a,b) => a - b)
    const minResolustion = sortResolution[0]
    const enoughTiles = sortResolution[maxHighResolutionTileCount-1] === minResolustion
    const initialResolution = 8
    return enoughTiles && (minResolustion !== initialResolution)
  }

  tileNominatedToTrunDetail = async () => {
    const getTileDistances = (tilesToGetDistance: Tile[]) => {
      const distances: {tile: Tile, distance: number}[] = []
      const cameraPosition = this.camera.position.clone()
      tilesToGetDistance.forEach( tile => {
        if (!tile.mesh) return
        const distance = cameraPosition.distanceTo(tile.mesh.position)
        distances.push({ tile, distance})
      })
      return distances
    }
    // const getThreshold = (tile: Tile) => (600 / tile.id.z) * 1/ ((tile.id.z-7) * (tile.id.z-7))
    const getThreshold = (tile: Tile) => tile.id.z === 9 ? 8 : tile.id.z === 8 ? 20: 20/ ((tile.id.z-8) * (tile.id.z-8)) - 1/(tile.id.z-8) - 0.14
    // 應該要加入「加入更精緻tile」按鈕，紀錄每一個最適合的縮放大小，再下參數,
    const getTileBeLookedAt = () => {
      const intersect = this.animateService.onIntersect.value[0]
      if (intersect) {
        const mesh = intersect.object as Object3D as Mesh<PlaneGeometry, MeshStandardMaterial>
        const name = intersect.object.name
        const regexToken = 'planeZ([0-9]+)X([0-9]+)Y([0-9]+)';
        const idArray = name.match(regexToken)        
        if(idArray && idArray.length === 4 && +idArray[1]) {
          const id = {z: +idArray[1], x: +idArray[2], y: +idArray[3]}
          const tile: Tile = { mesh, id}
          return tile
        }
      }
      return
    }
    const tileClosesToCameraTarget = getTileBeLookedAt()
    if (tileClosesToCameraTarget) {
      const tileDistances: {tile: Tile, distance: number}[] = getTileDistances([tileClosesToCameraTarget]).sort((a,b) => a.distance-b.distance)
      const closeToCamera: Tile[] = tileDistances.filter( ({tile, distance}) => {
        console.log(distance, getThreshold(tile));
        if(tile) this.nearestTileId = JSON.stringify(tile.id)
        this.nearestTileDistance = distance
        if (distance < getThreshold(tile)) {
          console.log(getThreshold(tile));
          
        }
        return distance < getThreshold(tile)
      }).map( ({tile, distance}) => tile)
      // const minResolution = this.tiles.map(tile => tile.id.z).sort( (a,b) => b-a)[0]
      // const closeEnoughMinResToTurnDetail = closeToCamera.filter( tile => tile.id.z === minResolution)
      return closeToCamera

    } else {
      return []
    }
  }

  getDetailedTile = (fromTiles: Tile[]) => {
    const newTiles: Tile[] = []
    fromTiles.forEach( fromTile => {
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          const newTileRes = fromTile.id.z + 1
          const newTileX = fromTile.id.x * 2 + x
          const newTileY = fromTile.id.y * 2 + y
          const newTile: Tile = { id: { 
            z: newTileRes,
            x: newTileX,
            y: newTileY,
          }}
          newTiles.push(newTile)
        }
      }
    })
    return newTiles
  }

  removeRoughTile = (roughTiles: Tile[]) => {
    roughTiles.forEach(roughTile => {
      const regexToken = `planeZ${roughTile.id.z}X${roughTile.id.x}Y${roughTile.id.y}`
      const regex = new RegExp(regexToken);
      const roughTile3d = this.scene.children.find( mesh => regex.test(mesh.name))
      console.log(roughTile3d?.name, regexToken, this.scene.children.map(plane => plane.name).join(', '));
      
      if (roughTile3d) {
        roughTile3d.removeFromParent()
        this.tiles = this.removeTileFromTileArray(roughTile, this.tiles)
      } else {
        console.error(JSON.stringify( roughTile.id), new Date().toISOString());
        throw new Error("no tile to remove");
      }
    })

  }
  
  removeTileFromScene = (tile3d: Object3D<Event>) => tile3d.removeFromParent()
  removeTileFromTileArray = (tileToRemove: Tile, array: Tile[]): Tile[] => array.filter( tile => !this.isTileIdEqual(tile, tileToRemove))

  isTileIdEqual = (atile: Tile, bTile: Tile) => {
    const sameX = atile.id.x === bTile.id.x
    const sameY = atile.id.y === bTile.id.y
    const sameZ = atile.id.z === bTile.id.z
    return sameX && sameY && sameZ
  }
}
