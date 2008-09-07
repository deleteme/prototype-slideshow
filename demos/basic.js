Event.observe(window, 'load', windowLoaded.bind(this));
function windowLoaded (e) {
  // simple usage
  this.basicExample = new SlideShow('basicExample', { slideDuration: 5, crossfade: true });
}
