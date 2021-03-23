<template>
  <div id="app">
    <DrawOnImage :imageUrl="imageUrl" @canvasLoaded="canvasLoaded = true" @onExportedDataUrl="sendFile" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import DrawOnImage from './components/DrawOnImage.vue'

export default Vue.extend({
  name: 'App',
  components: {
    DrawOnImage,
  },
  data() {
    return {
      imageUrl: '',
      // imageUrl:
      // 'https://firebasestorage.googleapis.com/v0/b/examnet-student-photos/o/eKyZwh8n2hqsgCnvTfNj.jpg?alt=media&token=c2a2969f-1bfc-4099-b3f9-b5d5323c573d',
    }
  },
  methods: {
    sendFile(dataUrl: any) {
      console.log('dataUrl', dataUrl)
    },
  },
})
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
