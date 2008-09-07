/*


Main SlideShow Class:

EXAMPLE USAGE:

  new SlideShow('container', { slideDuration: 2 });

*/
var SlideShow = Class.create({
  initialize: function(element, options){
    if (!$(element)) return;
    this.root = $(element);
    this.fireEvent('initializing', { slideshow: this });
    this.defaultOptions = $H({
      autoPlay: true,
      slideDuration: 5,
      transitionDuration: 1,
      loop: true,
      crossfade: false,
      slides: this.root.childElements(),
      pauseOnMouseover: true,
      beforeStart: function(){}, afterFinish: function(){}
    });
    this.loopCount = 0;
    this.slideIndex = 0;
    this.options = this.defaultOptions.merge(options);
    this.effectOptions = { duration: this.options.get('transitionDuration') / 2 };
    this.slides = this.options.get('slides');
    this.prep();
    this.paused = false;
    if (this.options.get('autoPlay')) this.play();
    this.fireEvent('initialized', { slideshow: this });
  },
  prep: function(){
    this.root.makePositioned().identify();
    
    for (var i=0; i < this.slides.length; i++) {
      this.prepSlide(this.slides[i]).setStyle({
        position: 'absolute', zIndex: i
      });
    };
    
    if (this.options.get('pauseOnMouseover')){
      this.root.observe('mouseover', this.pauseOnMouseover.bind(this)).observe('mouseout', this.resumeOnMouseout.bind(this))
    }
    
    this.fireEvent('prepped', { slideshow: this });
  },
  prepSlide: function(slide){
    return slide.setStyle({ display: 'none', opacity: 0 });
  },
  play: function(){
    console.log('PLAY');
    this.paused = false;
    this.transition();
    this.fireEvent('started', { slideshow: this });
  },
  pause: function(){
    console.log('PAUSED');
    this.paused = true;
    this.fireEvent('paused', { slideshow: this });
  },
  transition: function(){
    if (this.paused) return;
    // get slide after visible one, or 1st one if last is visible or none are visible

    this.coming = this.slides[this.slideIndex];
    this.going = this.coming.previous() || this.slides.last();
    
    var coming = this.coming; var going = this.going;
    
    // if not fresh start, fade
    if (going != coming) {
      // if crossfade
      if (this.options.get('crossfade')) {
        new Effect.Parallel(
          [new Effect.Appear(coming), new Effect.Fade(going)],
          {
            duration: this.options.get('transitionDuration'),
            afterFinish: this.prepSlide.curry(going)
          }
        );
      } else {
        going.fade({
          duration: this.options.get('transitionDuration') / 2,
          afterFinish: function(){
            this.prepSlide(going);
            coming.appear(this.effectOptions);
          }.bind(this)
        });
      }
    }
    // fade in the first time
    else {
      coming.appear(this.effectOptions);
    }
    
    this.loopCount++;
    this.slideIndex++;
    if (this.slides.length < this.slideIndex) this.slideIndex = 0;
    
    this.fireEvent('transitioned', { slideshow: this, coming: this.coming, going: this.going, loopCount: this.loopCount });
    if (this.options.get('slideDuration') > 0)
      this.transition.bind(this).delay(this.options.get('slideDuration'));
  },
  fireEvent: function(name, memo){
    // console.log(this.root.identify() + '_slideshow:' + name);
    this.root.fire(this.root.id + '_slideshow:' + name, memo);
  },
  pauseOnMouseover: function(e){
    if (this.paused || !this.mouseIsWithinSlideArea(e)) return;
    this.pause();
  },
  resumeOnMouseout: function(e){
    if (!this.paused || this.mouseIsWithinSlideArea(e)) return;
    // if mousing out within the slide area, return
    this.play();
  },
  mouseIsWithinSlideArea: function(e){
    var maxX = this.root.cumulativeOffset().left + this.root.getWidth();
    var minX = this.root.cumulativeOffset().left;
    var maxY = this.root.cumulativeOffset().top + this.root.getHeight();
    var minY = this.root.cumulativeOffset().top;
    if ($R(minX, maxX).include(e.pointerX()) && $R(minY, maxY).include(e.pointerY())) {
      return true; } else { return false; }
  }
});