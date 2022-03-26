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
  mergeTileData: {
    fromBlurredTile: TileId
    siblings: TileId[]
    siblingsExist: boolean
  }[] = []

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
    console.log(this.tiles);
    
  }

  addTilesToScene = (tiles: Tile[]) => {
    tiles.forEach( tile => {
      if (!tile.mesh) throw new Error("no mesh to add to scene");
      const tile3d = tile.mesh as Object3D      
      this.scene.add(tile3d)
    })
  }

  addDetailTileOnHtml = async (roughTiles: Tile[]) => {
    const newTiles = this.getDetailedTilesWithoutMesh(roughTiles)
    await this.addTileOnHtml(newTiles)
  }

  addTileOnHtml = async (tiles: Tile[]) => {
    this.tiles.push( ...tiles)    
    this.tileService.initTileMesh(tiles, this.tileService.initTileId)
    const objToDetectIntersect = this.tiles.map( tile => tile.mesh as Object3D)
    this.animateService.passIntersetObject(objToDetectIntersect)

    await this.textureService.applyTexture(tiles)
    // this.textureService.applyMockTexture(tiles)
    this.addTilesToScene(tiles)
    this.addedTiles.push({time: new Date().toISOString(), tileId: tiles.map( tile => tile.id)})
  }

  removeTileOnHtml = async (roughTiles: Tile[]) => {
    this.removeTiles(roughTiles)
    this.removedTiles.push({time: new Date().toISOString(), tileId: roughTiles.map( tile => tile.id)})
  }

  onMouseScroll = async () => {
    await this.updateTilesResolution()
  }

  onMouseUp = async () => {
    await this.updateTilesResolution()
  }

  updateTilesResolution = async () => {
    const canvasCenter: Vector3 = this.getCanvasCenter()
    const tilesToTurnDetail = this.tilesCloseToCanvasCenter(this.tiles, canvasCenter)    
    const tilesToTurnBlur = this.tilesFarToCanvasCenter(this.tiles, canvasCenter)
    const cameraZoomedEnough = this.canTurnDetail(tilesToTurnDetail)
    if (tilesToTurnDetail && canvasCenter) {
      if (cameraZoomedEnough) {
        try {
          this.currentRoughTiles = tilesToTurnDetail
          await this.removeTileOnHtml(tilesToTurnDetail)
          console.log(tilesToTurnDetail);
          await this.addDetailTileOnHtml(tilesToTurnDetail)
          
        } catch (error) {
          console.warn('abandon removing ', tilesToTurnDetail.map( tile => JSON.stringify(tile.id)).join(', '));
        }
      }

      const tilesFarToCamera = this.tilesFarToCamera(this.tiles, this.camera.position)
      const tilesToMerge:Tile[] = []
      tilesToMerge.push(...tilesToTurnBlur, ...tilesFarToCamera)
      const uniqueTilesToMerge:Tile[] = []
      tilesToMerge.forEach( tile => {
        const duplicate = uniqueTilesToMerge.some( uniqueTile => {
          return this.tileService.isTileEqual(uniqueTile, tile)
        })
        if (!duplicate) {
          uniqueTilesToMerge.push(tile)
        }
      })


      const tilesSiblingsCanMerge = this.checkSiblingsCanMerge(tilesToMerge, canvasCenter)
      await this.mergeTile(tilesSiblingsCanMerge)
    }

  }

  tilesFarToCamera = (tiles: Tile[], camera: Vector3) => {
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
    return tiles.filter( tile => {
      if (tile.mesh) {
        const distance = new Vector3().subVectors(tile.mesh.position, camera).length()
        const threshold = _getThreshold(tile)
        return distance > threshold * 10
      } 
      throw new Error("there are tiles missing mesh in runtime");
      
    })
  }

  mergeTile = async (tilesToMerge: Tile[]) => {
    
    const blurTileIds:TileId[] = []
    tilesToMerge.forEach( tileToMerge => {      
      const blurTileId = this.getBlurredIdFromDetailTile(tileToMerge.id)
      if (blurTileId) {
        const isDuplicate = blurTileIds.some( id => this.tileService.isTileIdEqual(id, blurTileId))
        if (!isDuplicate) {
          blurTileIds.push(blurTileId)
        }
      }
    })    
    const detailedTileIds = this.getDetailedTileIdsFromId(blurTileIds)
    for (const blurTileId of blurTileIds) {
      
      if (blurTileId.z > 7) {
        const blurTile: Tile = {id: blurTileId}
        this.addTileOnHtml([blurTile])
      }
    }


        
    for (const detailedTileId of detailedTileIds) {
      const detailedTile = this.getTileById(this.tiles, detailedTileId)
      if (detailedTile?.mesh) {
        if (detailedTile.id.z > 8) {
          this.removeTileFromScene(detailedTile.mesh)
          this.tiles = this.removeTileFromTileArray(detailedTile, this.tiles)
        }
      } else {
        throw new Error("incorrect tile mesh mapping");
      }
    }    
  }

  checkSiblingsCanMerge = (tiles: Tile[], canvasCenter: Vector3) => {
    const _checkTilesAllExist = (tileIdsToCheck: TileId[]) => {
      const existMap = tileIdsToCheck.map( tileIdToCheck => {
        const isExist = this.tiles.some( tile => this.tileService.isTileIdEqual(tileIdToCheck, tile.id))
        return { tile: tileIdToCheck, isExist: isExist}
      })
      const isAllExist = existMap.every( isExist => isExist.isExist )
      return isAllExist
    }
    const _checkSiblingsAllTooFar = (tileIdsToCheck: TileId[], canvasCenter: Vector3) => {
        const tilesToCheck = tileIdsToCheck.map( tileId => { return {id: tileId}})
        const tilesCount = tileIdsToCheck.length
        const tilesTooFar = this.tilesFarToCanvasCenter(tilesToCheck, canvasCenter)
        const tilesTooFarCount = tilesTooFar.length        
        return tilesCount === tilesTooFarCount
    }
    const tilesToMerge = tiles.filter( tile => {
      const blurredFromId = this.getBlurredIdFromDetailTile(tile.id)
      if (blurredFromId) {
        const siblingIds = this._getDetailedTileFromId(blurredFromId)
        const siblingsExist = _checkTilesAllExist(siblingIds)
        const siblingsAllFarToCanvasCenter = true
        this.mergeTileData.push({fromBlurredTile: blurredFromId, siblings: siblingIds, siblingsExist: siblingsExist})
        return siblingsExist && siblingsAllFarToCanvasCenter
      } else {
        console.error("No blurred tile");
        return false
      }
    })
    tilesToMerge.forEach( tile => {
      if(tile.mesh){
        const randomColor = Math.floor(Math.random()*0xffff00)
        tile.mesh.material.color = new Color(randomColor)
      }
    })
    return tilesToMerge
  }

  getBlurredIdFromDetailTile = (id: TileId):TileId => {
    const z = id.z - 1
    const x = Math.floor(id.x / 2)
    const y = Math.floor(id.y / 2)
    return { z, x, y}
  }

  getCanvasCenter = () => this.animateService.onCanvasIntersect.value[0].point

  tilesCloseToCanvasCenter = (tiles: Tile[], canvasCenter: Vector3) => {
    const _clearDebugLines = () => {
      this.lines.map( line => line.removeFromParent())
      this.lines = [] 
    }
    const _showDebuggerLines = (positionCenter: Vector3, cameraLookAt: Vector3, color: number = 0xff0000) => {
      // const lineMaterial = new LineBasicMaterial({ color: color, linewidth: 3})
      // const lineGeo = new BufferGeometry()
      // const vertices = new Float32Array([
      //   positionCenter.x, positionCenter.y, positionCenter.z,
      //   cameraLookAt.x, cameraLookAt.y, cameraLookAt.z
      // ])
      // lineGeo.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
      // const line = new Line(lineGeo, lineMaterial)
      // this.lines.push(line)
      // this.scene.add(line)
    }
    _clearDebugLines()
    return tiles.filter( tile => {
      const tileCenter = this.getTileCenter(tile)
      const tileCorner = this.getTileCorner(tile)
      const tileCenterToCanvasCenter = new Vector3().subVectors( tileCenter, canvasCenter).length()
      const tileCornerToCanvasCenter = new Vector3().subVectors( tileCenter, tileCorner).length()
      const tileCornerToOppositeCorner = tileCornerToCanvasCenter * 2
      const tileCloseToCanvasCenter = tileCenterToCanvasCenter < tileCornerToOppositeCorner      
      _showDebuggerLines(tileCorner, canvasCenter)
      _showDebuggerLines(tileCenter, tileCorner, 0x000000)
      return tileCloseToCanvasCenter
    })
  }

  getTileCenter = (tile: Tile) => {
    const rate = Math.pow(2, tile.id.z-8) // Magnificate Rate
    const tileWidth = 1/rate * 12
    const tileCenterOffset = tileWidth/2
    const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate)) + tileCenterOffset
    const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate) + tileCenterOffset        
    return new Vector3(tileCenterX, 0,tileCenterY)
  }

  getTileCorner = (tile: Tile) => {
    const rate = Math.pow(2, tile.id.z-8) // Magnificate Rate
    const tileWidth = 1/rate * 12
    const tileCenterX = tileWidth * (tile.id.x - (this.tileService.initTileId.x * rate))
    const tileCenterY = tileWidth * (tile.id.y - this.tileService.initTileId.y * rate)        
    return new Vector3(tileCenterX, 0,tileCenterY)
  }

  tilesFarToCanvasCenter = (tiles: Tile[], canvasCenter: Vector3) => {
    return tiles.filter( tile => {
      const tileCenter = this.getTileCenter(tile)
      const tileCorner = this.getTileCorner(tile)
      const tileCenterToCanvasCenter = new Vector3().subVectors( tileCenter, canvasCenter).length()
      const tileCornerToCanvasCenter = new Vector3().subVectors( tileCenter, tileCorner).length()
      const tileCornerToOppositeCorner = tileCornerToCanvasCenter * 2
      const tileFarToCanvasCenter = tileCenterToCanvasCenter > tileCornerToOppositeCorner * 4
      return tileFarToCanvasCenter
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

  _getDetailedTile = (fromTile: Tile) => {
    const newTiles: Tile[] = []
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
    return newTiles
  }

  _getDetailedTileFromId = (fromTileId: TileId) => {
    const newTileIds: TileId[] = []
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          const newTileRes = fromTileId.z + 1
          const newTileX = fromTileId.x * 2 + x
          const newTileY = fromTileId.y * 2 + y
          const newTile: TileId = { 
            z: newTileRes,
            x: newTileX,
            y: newTileY,
          }
          newTileIds.push(newTile)
        }
      }
    return newTileIds
  }

  getDetailedTilesWithoutMesh = (fromTiles: Tile[]) => {
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

  getDetailedTileIdsFromId = (fromTileIds: TileId[]) => {
    const newTileIds: TileId[] = []
    fromTileIds.forEach( fromTileId => {
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          const newTileRes = fromTileId.z + 1
          const newTileX = fromTileId.x * 2 + x
          const newTileY = fromTileId.y * 2 + y
          const newTileId: TileId = { 
            z: newTileRes,
            x: newTileX,
            y: newTileY,
          }
          newTileIds.push(newTileId)
        }
      }
    })
    return newTileIds
  }

  removeTiles = (roughTiles: Tile[]) => {
    roughTiles.forEach(tile => this.removeTile(tile))
  }

  removeTile = (tile: Tile) => {
    const regexToken = `planeZ${tile.id.z}X${tile.id.x}Y${tile.id.y}`
    const regex = new RegExp(regexToken);
    const tile3d = this.scene.children.find( mesh => regex.test(mesh.name))      
    if (tile3d) {
      this.removeTileFromScene(tile3d)
      this.tiles = this.removeTileFromTileArray(tile, this.tiles)
    } else {
      console.error(JSON.stringify( tile.id), new Date().toISOString());
      throw new Error("no tile to remove");
    }
  }
  
  removeTileFromScene = (tile3d: Object3D<THREE.Event>) => tile3d.removeFromParent()
  removeTilesFromScene = (tiles: Tile[]) => tiles.forEach( tile => tile.mesh?.removeFromParent())
  removeTileFromTileArray = (tileToRemove: Tile, array: Tile[]): Tile[] => array.filter( tile => !this.tileService.isTileEqual(tile, tileToRemove))

  getTileById = (fromTiles: Tile[], byId: TileId) => fromTiles.find( tile => {
    const found = this.tileService.isTileIdEqual(tile.id, byId)    
    return found
  })
}
