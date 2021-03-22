<template>
  <div>
    <div class="added-resource animation" v-if="!canvasLoaded">
      <div class="added-resource__wrapper" @click="showFileChooser">
        <span class="added-resource__wrapper__plus">+</span>
        <span class="added-resource__wrapper__text">Ladda upp bild</span>
      </div>
    </div>
    <div>
      <input @change="setImage" style="display: none" ref="input" type="file" name="image" accept="image/*" />
    </div>
    <div class="tools" v-if="canvasLoaded" style="position: sticky; top: 0px">
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
      <div @click="$emit('onExportedDataUrl', canvas.toDataURL())">Spara bild</div>
    </div>

    <canvas
      ref="canvas"
      @mousemove="sketchpadMouseMove"
      @mousedown="sketchpadMouseDown"
      @mouseup="sketchpadMouseUpInside"
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

      ctx: null as CanvasRenderingContext2D | null,
      cStep: -1,
      cPushArray: [] as any,
      recordPoints: [] as any,
      image: null,
      lastMousePos: { x: 0, y: 0 },
      mousePos: { x: 0, y: 0 },
      size: 8,
      color: '#000',
      mouseDown: 0,
    }
  },
  watch: {
    imageUrl(newValue) {
      console.log('newValue', newValue)
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
    window.addEventListener('mouseup', this.sketchpadMouseUp)
    if (this.imageUrl !== '') this.loadImage(this.imageUrl)
  },
  mounted() {
    this.canvas = (this.$refs as any).canvas as HTMLCanvasElement | null
    if (this.canvas) {
      this.canvas.width = (this.$el as any).offsetWidth
    }
  },
  beforeDestroy() {
    window.removeEventListener('mouseup', this.sketchpadMouseUp)
  },
  methods: {
    showFileChooser() {
      ;(this.$refs as any).input.click()
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
    sketchpadMouseDown() {
      this.mouseDown = 1
      this.lastMousePos = this.mousePos
      this.drawDot()
    },
    sketchpadMouseMove(e: any) {
      // Update the mouse co-ordinates when moved
      this.getMousePos(e)

      // Draw a pixel if the mouse button is currently being pressed
      if (this.mouseDown == 1) {
        this.drawDot()
      }
    },
    sketchpadMouseUp() {
      this.recordPoints = []
      this.mouseDown = 0
    },
    sketchpadMouseUpInside() {
      this.cPush()
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
    drawImageScaled(img: any) {
      if (this.ctx && this.canvas) {
        var hRatio = this.canvas.width / img.width
        var vRatio = this.canvas.height / img.height
        var ratio = Math.min(hRatio, vRatio)
        this.canvas.height = img.height * ratio
        this.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio)
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
      this.cPushArray.push(this.canvas?.toDataURL())
    },
    cUndo() {
      //console.log("outside "+cStep);
      if (this.cStep > 0) {
        //alert("in undo: "+cPushArray.length)
        this.cStep = this.cStep - 1 //console.log("Inside "+cStep);
        console.log('this.cStep', this.cStep)
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
  margin: 10px 0 10px 35px;
  border-radius: 5px;
  border: 1px dotted grey;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
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
.animation {
  -webkit-transition: all 0.2s ease-in-out;
  -moz-transition: all 0.2s ease-in-out;
  -o-transition: all 0.2s ease-in-out;
  transition: all 0.2s ease-in-out;
}
</style>
