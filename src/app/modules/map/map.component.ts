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
  lines:Line<BufferGeometry, LineBasicMaterial>[] = []

  // attribute to display on HTML
  nearestTileId: string = '{x: 0, y: 0, z:0}'
  nearestTileDistance: number = 0
  currentRoughTiles: Tile[] = []
  removedTiles:  { time: string, tileId:TileId[]}[] = []
  addedTiles: { time: string, tileId:TileId[]}[] = []
  center:number[] = []
  distances:number[] = []
  tileLog: { tiles: 
    { tile: Tile, id: TileId, length: number, threshold: number, cameraDistance: number}[], 
    slicedTiles: Tile[], 
    closeEnoughToCamera: Tile[], 
    } = { tiles: [], slicedTiles: [], closeEnoughToCamera: []}

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
    this.canvasContainer.nativeElement.addEventListener('mouseup', this.onMouseUp)
    this.camera = this.cameraService.makeCamera(canvasDimention)
    this.scene.add(this.camera)
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.animateService.animate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition, 600)
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
    await this.updateTilesResolution()
  }

  onMouseUp = async () => {
    await this.updateTilesResolution()
  }

  updateTilesResolution = async () => {
    // const tilesToUpdate = this.getTilesCloseToCanvasCenter(this.tiles, 4)
    const canvasCenter: Vector3 = this.getCanvasCenter()
    const tilesToUpdate = this.tilesCloseToCanvasCenter(this.tiles, canvasCenter)
    console.log(tilesToUpdate);
    
    const cameraZoomedEnough = this.canTurnDetail(tilesToUpdate)
    if (tilesToUpdate) {
      if (cameraZoomedEnough) {
        this.currentRoughTiles = tilesToUpdate
        try {
          await this.removeRoughTileOnHtml(tilesToUpdate)
          await this.addDetailTileOnHtml(tilesToUpdate)
        } catch (error) {
          console.warn('abandon removing ', tilesToUpdate.map( tile => JSON.stringify(tile.id)).join(', '));
        }
      }
    }
  }

  getCanvasCenter = () => this.animateService.onCanvasIntersect.value[0].point

  tilesCloseToCanvasCenter = (tiles: Tile[], canvasCenter: Vector3) => {
    const _clearDebugLines = () => {
      this.lines.map( line => line.removeFromParent())
      this.lines = [] 
    }
    const _showDebuggerLines = (positionCenter: Vector3, cameraLookAt: Vector3, color: number = 0xff0000) => {
      const lineMaterial = new LineBasicMaterial({ color: color, linewidth: 3})
      const lineGeo = new BufferGeometry()
      const vertices = new Float32Array([
        positionCenter.x, positionCenter.y, positionCenter.z,
        cameraLookAt.x, cameraLookAt.y, cameraLookAt.z
      ])
      lineGeo.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
      const line = new Line(lineGeo, lineMaterial)
      this.lines.push(line)
      this.scene.add(line)
    }
    const getTileCenter = (tile: Tile) => {
      const rate = Math.pow(2, tile.id.z-8) // Magnificate Rate
      const tileWidth = 1/rate * 12
      const tileCenterOffset = tileWidth/2
      const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate)) + tileCenterOffset
      const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate) + tileCenterOffset        
      return new Vector3(tileCenterX, 0,tileCenterY)
    }
    const getTileCorner = (tile:Tile) => {      
      const rate = Math.pow(2, tile.id.z-8) // Magnificate Rate
      const tileWidth = 1/rate * 12
      const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate))
      const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate)        
      return new Vector3(tileCenterX, 0,tileCenterY)
    }
    _clearDebugLines()
    return tiles.filter( tile => {
      const tileCenter = getTileCenter(tile)
      const tileCorner = getTileCorner(tile)
      const tileCenterToCanvasCenter = new Vector3().subVectors( tileCenter, canvasCenter).length()
      const tileCornerToCanvasCenter = new Vector3().subVectors( tileCenter, tileCorner).length()
      const tileCornerToOppositeCorner = tileCornerToCanvasCenter * 2
      const tileCloseToCanvasCenter = tileCenterToCanvasCenter < tileCornerToOppositeCorner      
      _showDebuggerLines(tileCorner, canvasCenter)
      _showDebuggerLines(tileCenter, tileCorner, 0x000000)
      return tileCloseToCanvasCenter
    })
  }

  canTurnDetail = (tiles: Tile[]) => {
    const _getTileCameraDistances = (tiles: Tile[]) => {
      const distances: {tile: Tile, distance: number}[] = []
      const cameraPosition = this.camera.position.clone()
      const _getDistance = (tile: Tile) => {
        if (tile.mesh) {
          const distance = cameraPosition.distanceTo(tile.mesh.position)
          distances.push({ tile, distance})
        } else {
          console.error('no mesh to detail');
        }
      }
      tiles.forEach( tile => _getDistance(tile))
      return distances
    }
    const _getThreshold = (tile: Tile) => {
      switch (tile.id.z) {
        case 9:
          return 8
        case 8:
          return 20
        default:
          return 20/ ((tile.id.z-8) * (tile.id.z-8)) - 1/(tile.id.z-8) - 0.14
      }
    }
    const lengthMapping = _getTileCameraDistances(tiles)
    const canTrunDetail = lengthMapping.some( ({tile, distance}) => {
      const foundTileInLog = this.tileLog.tiles.find( tileInLog => (tileInLog.id.z === tile.id.z) && (tileInLog.id.x === tile.id.x) && (tileInLog.id.y === tile.id.y) )
      if(foundTileInLog) {
        foundTileInLog.threshold = _getThreshold(tile)
        foundTileInLog.cameraDistance = Math.floor(distance*100)/100
      }
      return distance < _getThreshold(tile)
    })
    return canTrunDetail
  }

  getTilesCloseToCanvasCenter = (tiles: Tile[], count: number) => {
    const _clearDebugLines = () => {
      this.lines.map( line => line.removeFromParent())
      this.lines = [] 
    }
    const _getTilePositionCenter = (tile: Tile) => {
      const rate = Math.pow(2, tile.id.z-8) // Magnificate Rate
      const tileWidth = 1/rate * 12
      const tileCenterOffset = tileWidth/2
      const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate)) + tileCenterOffset
      const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate) + tileCenterOffset        
      return new Vector3(tileCenterX, 0,tileCenterY)
    }
    const _showDebuggerLines = (positionCenter: Vector3, cameraLookAt: Vector3, ) => {
      const lineMaterial = new LineBasicMaterial({ color: 0xff0000, linewidth: 3})
      const lineGeo = new BufferGeometry()
      const vertices = new Float32Array([
        positionCenter.x, positionCenter.y, positionCenter.z,
        cameraLookAt.x, cameraLookAt.y, cameraLookAt.z
      ])
      lineGeo.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
      const line = new Line(lineGeo, lineMaterial)
      this.lines.push(line)
      this.scene.add(line)
    }
    const mapDistances = (tiles: Tile[]) => {
      this.tileLog.tiles = []
      const lengthMappings = tiles.map( tile => {
        const positionCenter = _getTilePositionCenter(tile)        
        const distanceToCameraLookAt = new Vector3().subVectors(positionCenter, canvasCenter).length()
        // _showDebuggerLines(positionCenter, canvasCenter)
        this.tileLog.tiles.push({ tile, id: tile.id, length: Math.floor(distanceToCameraLookAt*100)/100, threshold: -1, cameraDistance: -1})        
        const mapping: TileDistanceMap = { tile, distance: distanceToCameraLookAt}
        return mapping
      })
      this.tileLog.tiles = this.tileLog.tiles.sort( (a,b) => a.length - b.length)
      return lengthMappings
    }

    // _clearDebugLines()
    const canvasCenter = this.animateService.onCanvasIntersect.value[0].point
    let distancesMapping: TileDistanceMap[] = mapDistances(tiles)
    distancesMapping = distancesMapping.sort( (a,b) => a.distance - b.distance)
    distancesMapping = distancesMapping.slice(0,count)
    const resultTiles = distancesMapping.map( mapping => mapping.tile)
    this.tileLog.slicedTiles = resultTiles
    return resultTiles
  }

  hasEnoughDetailedTiles = (maxHighResolutionTileCount: number) => {
    const resolutions:number[] = this.tiles.map( tile => tile.id.z)
    const sortResolution = resolutions.sort((a,b) => a - b)
    const minResolustion = sortResolution[0]
    const enoughTiles = sortResolution[maxHighResolutionTileCount-1] === minResolustion
    const initialResolution = 8
    return enoughTiles && (minResolustion !== initialResolution)
  }

  selectTileToTrunDetail = async (tileClosesToCenter: Tile[]) => {
    const _getTileCameraDistances = (tiles: Tile[]) => {
      const distances: {tile: Tile, distance: number}[] = []
      const cameraPosition = this.camera.position.clone()
      const _getDistance = (tile: Tile) => {
        if (tile.mesh) {
          const distance = cameraPosition.distanceTo(tile.mesh.position)
          distances.push({ tile, distance})
        } else {
          console.error('no mesh to detail');
        }
      }
      tiles.forEach( tile => _getDistance(tile))
      return distances
    }
    const _getCloseEnoughToCamera = (tileDistances: {tile: Tile, distance: number}[]) => {
      const _getThreshold = (tile: Tile) => {
        switch (tile.id.z) {
          case 9:
            return 8
          case 8:
            return 20
          default:
            return 20/ ((tile.id.z-8) * (tile.id.z-8)) - 1/(tile.id.z-8) - 0.14
        }
      }
      return tileDistances.filter( ({tile, distance}) => {
        if(tile) this.nearestTileId = JSON.stringify(tile.id)
        this.nearestTileDistance = distance
        const foundTileInLog = this.tileLog.tiles.find( tileInLog => (tileInLog.id.z === tile.id.z) && (tileInLog.id.x === tile.id.x) && (tileInLog.id.y === tile.id.y) )
        if(foundTileInLog) {
          foundTileInLog.threshold = _getThreshold(tile)
          foundTileInLog.cameraDistance = Math.floor(distance*100)/100
        }
        return distance < _getThreshold(tile)
      }).map( ({tile, distance}) => tile)
    }

    // const tilesBeenLooked = _getTileBeLookedAt()
      const tileDistances: {tile: Tile, distance: number}[] = _getTileCameraDistances(tileClosesToCenter).sort((a,b) => a.distance-b.distance)
      let selectedTile: Tile[] = _getCloseEnoughToCamera(tileDistances)
      this.tileLog.closeEnoughToCamera = selectedTile
      return selectedTile
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
