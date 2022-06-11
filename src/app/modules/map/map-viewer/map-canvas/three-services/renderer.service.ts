import { ElementRef, Injectable } from '@angular/core';
import { ClientPerformance } from 'src/app/shared/enums/clientPerformance';
import { Vector2, WebGLRenderer } from 'three';

@Injectable({
  providedIn: 'root'
})
export class RendererService {

  constructor() { }

  renderer = new WebGLRenderer({ precision: 'lowp' , antialias: true})

  makeRenderer = (domToAppend: ElementRef<HTMLCanvasElement>, canvasDimention: Vector2) => {
    this.renderer.setSize(canvasDimention.x, canvasDimention.y)
    domToAppend.nativeElement.appendChild(this.renderer.domElement)
    this.renderer.shadowMap.enabled = true
    this.renderer.domElement.id = 'canvas'
    return this.renderer
  }

  chechClientPerformance = () => {
    const expectedFrameRate = this.renderer.info.render.frame / 30
    const highPerformance = expectedFrameRate > 10
    const lowPerformance = expectedFrameRate < 4
    const result = highPerformance? ClientPerformance.HIGH: lowPerformance? ClientPerformance.LOW: ClientPerformance.MEDIUM
    return result
  }

  updateMouse = (event: MouseEvent) => {
    const domLeftPadding = this.renderer.domElement.offsetLeft
    const domTopPadding = this.renderer.domElement.offsetTop
    const mouseX = event.clientX
    const mouseY = event.clientY
    const canvasWidth = this.renderer.domElement.width
    const canvasHeight = this.renderer.domElement.height
    const mouseXInCanvas = mouseX - domLeftPadding
    const mouseYInCanvas = mouseY - domTopPadding
    const mouseOnCanvas = new Vector2(
      (mouseXInCanvas / canvasWidth) * 2 - 1,
       - (mouseYInCanvas / canvasHeight) * 2 + 1)
    
    return mouseOnCanvas
  }
}
