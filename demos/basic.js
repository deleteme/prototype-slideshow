Event.observe(window, 'load', windowLoaded.bind(this));
function windowLoaded (e) {
  // simple usage
  this.basicExample = new SlideShow('basicExample', { autoPlay: false, slideDuration: 5, crossFade: true });
}
