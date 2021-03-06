<template>
  <div>
    <h4 v-if="!canvasLoaded" style="text-align: center">Lägg till</h4>
    <div style="display: flex; justify-content: center">
      <div class="added-resource animation" v-if="!canvasLoaded">
        <div class="added-resource__wrapper" @click="showFileChooser">
          <span class="added-resource__wrapper__plus">+</span>
          <span class="added-resource__wrapper__text">Ladda upp bild</span>
        </div>
      </div>
      <div class="added-resource animation" v-if="!canvasLoaded">
        <div class="added-resource__wrapper" @click="openCanvasWithoutImage">
          <span class="added-resource__wrapper__plus">+</span>
          <span class="added-resource__wrapper__text">Rityta</span>
        </div>
      </div>
    </div>
    <div>
      <input @change="setImage" style="display: none" ref="input" type="file" name="image" accept="image/*" />
    </div>
    <div class="tools" v-if="canvasLoaded" style="position: sticky; top: 0px; margin: 5px 0 0 35px">
      <span class="svg" v-html="undo" @click="cUndo"></span>
      <span class="svg" v-html="redo" @click="cRedo"></span>
      <div>
        <span>Färg på penna</span>
        &nbsp;
        <input v-model="color" @change="onColorChange" type="color" />
      </div>
      <div>
        <span>Storlek på penna</span>
        &nbsp;
        <input type="text" v-model="size" @input="onSizeChange" style="max-width: 20px" />
      </div>
      <button @click="saveImage" class="reused-button reused-button--blue">Spara bild</button>
    </div>

    <canvas
      ref="canvas"
      @mousemove="mouseMove"
      @mousedown="mouseDown"
      @mouseup="mouseUpInside"
      @touchstart="touchStart"
      @touchend="touchEnd"
      @touchmove="touchMove"
      width="0"
      height="0"
    ></canvas>
  </div>
</template>

<script lang="ts">
import { undo, redo } from '@/script/svg'
import Vue from 'vue'
export default Vue.extend({
  components: {
    // AttachmentPreview,
  },
  props: {
    // uppgift: { type: Object, default: () => {} },
    // data: { type: Object, default: () => ({}) },
    imageUrl: { type: String, default: '' },
    // num: { type: Number, default: null },
    // str: { type: String, default: '' },
  },
  data() {
    return {
      canvas: null as HTMLCanvasElement | null,
      canvasLoaded: false,
      drawing: true,
      ctx: null as CanvasRenderingContext2D | null,
      cStep: -1,
      cPushArray: [] as any,
      recordPoints: [] as any,
      image: null,
      lastMousePos: { x: 0, y: 0 },
      mousePos: { x: 0, y: 0 },
      size: 8,
      color: '#000',
      isMouseDown: false,
      reduceWidthForEnablingScrollOnIpad: 60,
    }
  },
  watch: {
    imageUrl(newValue) {
      this.loadImage(newValue)
    },
  },
  computed: {
    undo() {
      return undo
    },
    redo() {
      return redo
    },
  },
  created() {
    window.addEventListener('mouseup', this.mouseUp)
    if (this.imageUrl !== '') this.loadImage(this.imageUrl)
  },
  mounted() {
    this.canvas = (this.$refs as any).canvas as HTMLCanvasElement | null
    if (this.canvas) {
      this.canvas.width = (this.$el as any).offsetWidth - 2
    }
  },
  beforeDestroy() {
    window.removeEventListener('mouseup', this.mouseUp)
  },
  methods: {
    saveImage() {
      this.$emit('onExportedDataUrl', { dataUrl: this.canvas?.toDataURL(), type: 'image' })
    },
    showFileChooser() {
      this.$emit('addOwnImage')
      ;(this.$refs as any).input.click()
    },
    openCanvasWithoutImage() {
      this.$emit('onlyDrawingArea')
      if (this.canvas) {
        this.canvas.width = (this.$el as any).offsetWidth - this.reduceWidthForEnablingScrollOnIpad
        this.canvas.height = 450
        this.canvas.style.border = '1px dotted black'
        this.ctx = this.canvas?.getContext('2d') ?? null
        if (this.ctx) {
          this.ctx.fillStyle = 'white' // White background instead of transparent
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
        setTimeout(() => {
          this.canvasLoaded = true
          this.cPush()

          this.$emit('canvasLoaded')
        }, 100)
      }
    },

    loadImage(url: string) {
      var base_image = new Image()
      base_image.crossOrigin = 'anonymous'
      base_image.src = url

      // Make sure the image is loaded first otherwise nothing will draw.
      base_image.onload = () => {
        if (this.canvas) {
          this.canvas.height = base_image.height
          this.ctx = this.canvas?.getContext('2d') ?? null

          this.drawImageScaled(base_image)
          this.canvasLoaded = true
          this.$emit('canvasLoaded')
        }
      }
    },
    setImage(e: any) {
      const file = e.target.files[0]
      if (file.type.indexOf('image/') === -1) {
        alert('Please select an image file')
        return
      }
      if (typeof FileReader === 'function') {
        const reader = new FileReader()
        reader.onload = (event) => {
          let base_image = new Image()
          base_image.src = (event?.target?.result ?? null) as any
          base_image.onload = () => {
            if (this.canvas) {
              this.canvas.height = base_image.height
              this.ctx = this.canvas?.getContext('2d') ?? null
              this.drawImageScaled(base_image)
              this.canvasLoaded = true
              this.$emit('canvasLoaded')
            }
          }
        }
        reader.readAsDataURL(file)
      } else {
        alert('Sorry, FileReader API not supported')
      }
    },
    setColor(color: string) {
      if (this.ctx) {
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = color
      }
    },
    onSizeChange() {
      this.setSize(this.size)
    },
    onColorChange() {
      this.setColor(this.color)
    },

    setSize(size: number) {
      if (this.ctx) {
        this.ctx.lineWidth = size
      }
    },
    drawDot() {
      if (this.ctx) {
        this.setSize(this.size)
        this.setColor(this.color)
        if (this.recordPoints.length === 0) {
          this.ctx.beginPath()
          this.ctx.arc(this.mousePos.x, this.mousePos.y, this.size * 0.5, 0, Math.PI * 2, false)
          this.ctx.fill()
          this.ctx.closePath()
          this.lastMousePos = this.mousePos
          this.recordPoints.push({ x: this.mousePos.x, y: this.mousePos.y })
        } else {
          this.ctx.beginPath()
          this.recordPoints.push({ x: this.mousePos.x, y: this.mousePos.y })
          if (this.recordPoints.length < 3) {
            this.ctx.moveTo(this.lastMousePos.x, this.lastMousePos.y)
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y)
            this.ctx.stroke()
          }
          if (this.recordPoints.length > 3) {
            this.ctx.beginPath()
            this.ctx.moveTo(this.recordPoints[0].x, this.recordPoints[0].y)
            for (var i = 1; i < this.recordPoints.length - 2; i++) {
              var c = (this.recordPoints[i].x + this.recordPoints[i + 1].x) / 2
              var d = (this.recordPoints[i].y + this.recordPoints[i + 1].y) / 2
              this.ctx.quadraticCurveTo(this.recordPoints[i].x, this.recordPoints[i].y, c, d)
            }
            this.ctx.quadraticCurveTo(
              this.recordPoints[i].x,
              this.recordPoints[i].y,
              this.recordPoints[i + 1].x,
              this.recordPoints[i + 1].y,
            )
            this.ctx.stroke()
          }
          this.lastMousePos = this.mousePos
        }
      }
    },
    getMousePos(e: any) {
      if (e.offsetX) {
        this.mousePos.x = e.offsetX
        this.mousePos.y = e.offsetY
      } else if (e.layerX) {
        this.mousePos.x = e.layerX
        this.mousePos.y = e.layerY
      }
    },
    mouseDown() {
      this.isMouseDown = true
      this.lastMousePos = this.mousePos
      this.drawDot()
    },
    mouseMove(e: any) {
      this.getMousePos(e)
      if (this.isMouseDown === true && this.drawing === true) {
        this.drawDot()
      }
      // this.addText()
    },
    mouseUp() {
      this.recordPoints = []
      this.isMouseDown = false
    },
    mouseUpInside() {
      this.cPush()
    },
    getTouchPos(e: any) {
      var rect = this.canvas?.getBoundingClientRect()
      if (!rect) return
      this.mousePos.x = e.touches[0].clientX - rect.left
      this.mousePos.y = e.touches[0].clientY - rect.top
    },
    touchStart(e: any) {
      if (e.touches.length > 1) {
        //kanske ska vara  Array.from(e.touches)>1
        return
      } else {
        this.getTouchPos(e)
        this.isMouseDown = true
        this.lastMousePos = this.mousePos
        this.drawDot()
      }
    },
    touchEnd(e: any) {
      if (e.target === this.canvas) {
        e.preventDefault()
        this.cPush()
        this.recordPoints = []
        this.isMouseDown = false
      }
    },
    touchMove(e: any) {
      if (e.target === this.canvas) {
        e.preventDefault()
        this.getTouchPos(e)
        if (this.isMouseDown === true && this.drawing === true) {
          this.drawDot()
        }
      }
    },
    drawImageScaled(img: any) {
      if (this.ctx && this.canvas) {
        var hRatio = this.canvas.width / img.width
        var vRatio = this.canvas.height / img.height
        var ratio = Math.min(hRatio, vRatio)
        this.canvas.height = img.height * ratio
        this.canvas.width = this.canvas.width - this.reduceWidthForEnablingScrollOnIpad
        this.ctx.drawImage(
          img,
          0,
          0,
          img.width - this.reduceWidthForEnablingScrollOnIpad,
          img.height,
          0,
          0,
          img.width * ratio - this.reduceWidthForEnablingScrollOnIpad,
          img.height * ratio,
        )
        this.cPush()
        this.setSize(8)
      }
    },
    // Clear the canvas
    clearCanvas() {
      if (this.ctx) {
        var pencilColor = this.ctx.strokeStyle
        var pencilWidth = this.ctx.lineWidth
        this.ctx.lineWidth = pencilWidth
        this.ctx.strokeStyle = pencilColor
      }
    },
    drawDataURLOnCanvas(strDataURL: any) {
      this.clearCanvas()
      var img = new Image()
      img.onload = () => {
        this.canvas?.getContext('2d')?.drawImage(img, 0, 0)
      }
      img.src = strDataURL
    },
    cPush() {
      this.cStep = this.cStep + 1
      this.cPushArray.splice(this.cStep, this.cPushArray.length - this.cStep)
      this.cPushArray.push(this.canvas?.toDataURL())
    },
    cUndo() {
      //console.log("outside "+cStep);
      if (this.cStep > 0) {
        //alert("in undo: "+cPushArray.length)
        this.cStep = this.cStep - 1 //console.log("Inside "+cStep);
        let strDataURL = this.cPushArray[this.cStep]
        this.drawDataURLOnCanvas(strDataURL)
      }
    },
    cRedo() {
      if (this.cStep < this.cPushArray.length - 1) {
        this.cStep = this.cStep + 1

        let strDataURL = this.cPushArray[this.cStep]
        this.drawDataURLOnCanvas(strDataURL)
      }
    },
  },
})
</script>
<style lang="less" scoped>
// @import '~style/main.less';
img {
  max-width: 100%;
  height: auto;
}
.tools {
  position: sticky;
  display: flex;
  align-items: center;
  cursor: pointer;
  & > *:not(:first-child) {
    margin-left: 10px;
  }
}

.added-resource {
  height: 70px;
  width: 65px;
  border-radius: 5px;
  border: 1px dotted grey;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  &:not(:first-child) {
    margin-left: 10px;
  }
  &:hover {
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  }
  &__wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    // margin-top: 15px;
    align-items: center;
    padding: 4px;

    color: grey;
    &__plus {
      font-size: 32px;
      line-height: 0.6;
      align-items: center;
    }
    &__text {
      text-align: center;
      font-size: 8px;
    }
  }
}

@reused-button-height: 25px;
@reused-button-background-color-blue: rgba(24, 160, 251, 1);
@reused-button-background-color-blue-hover: rgb(137, 201, 243);
@reused-button-background-color-grey: rgba(161, 161, 161, 1);
@reused-button-background-color-grey-hover: rgb(106, 106, 106);
.reused-button {
  padding: 10px;
  text-decoration: bold;
  text-transform: none;
  outline: 0;
  cursor: pointer;
  width: 100px;
  border-radius: 5px;
  height: @reused-button-height;
  min-height: @reused-button-height;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  // line-height: calc(~'@{reused-button-height} - 2px');
  line-height: 28px;
  position: relative;

  &--blue {
    background-color: @reused-button-background-color-blue;
    border: 1px solid @reused-button-background-color-blue;
    color: white;

    &:hover {
      background-color: @reused-button-background-color-blue-hover;
      border: 1px solid @reused-button-background-color-blue-hover;
    }
  }
  &--grey {
    background-color: @reused-button-background-color-grey;
    border: 1px solid @reused-button-background-color-grey;
    color: white;

    &:hover {
      background-color: @reused-button-background-color-grey-hover;
      border: 1px solid @reused-button-background-color-grey-hover;
    }
  }
}

.animation {
  -webkit-transition: all 0.2s ease-in-out;
  -moz-transition: all 0.2s ease-in-out;
  -o-transition: all 0.2s ease-in-out;
  transition: all 0.2s ease-in-out;
}
</style>
