<template>
  <RouterView />
  <Footer />
</template>

<script>
  import { RouterView } from 'vue-router'
  import Footer from './components/Footer.vue';

  export default {
    components: {
      RouterView,
      Footer
    },
    name: 'App',
  }

</script>

<style>

</style>
