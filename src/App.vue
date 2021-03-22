<template>
  <div id="app">
    <DrawOnImage
      :imageUrl="imageUrl"
      @canvasLoaded="canvasLoaded = true"
      @updateAddedResources="updateAddedResources"
      @onExportedDataUrl="sendFile"
    />
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
      imageUrl:
        'https://firebasestorage.googleapis.com/v0/b/examnet-student-photos/o/eKyZwh8n2hqsgCnvTfNj.jpg?alt=media&token=c2a2969f-1bfc-4099-b3f9-b5d5323c573d',
    }
  },
  methods: {
    updateAddedResources(obj: any) {
      console.log('obj', obj)
      // const addedResources = {
      //   uid: this.uppgift.uid,
      //   resources: [
      //     { order: 1, resourceType: 'image', resourceLink: 'lala', timeStamp: dayjs().format('YYYYMMDDHHmmss') },
      //     { order: 2, resourceType: 'image', resourceLink: 'lolo', timeStamp: dayjs().format('YYYYMMDDHHmmss') },
      //   ],
      // }

      // this.$root.$emit('updateAddedResources', addedResources)
    },
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
