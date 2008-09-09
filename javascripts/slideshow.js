/*


Main SlideShow Class:

EXAMPLE USAGE:

  new SlideShow('container', { slideDuration: 2 });

*/

/*
  TODO make the default slideshow class use dom:loaded and window:loaded custom events
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
      crossFade: false,
      slides: this.root.childElements(),
      pauseOnMouseover: true,
      beforeStart: function(){}, afterFinish: function(){}
    });
    
    this.loopCount = 0;
    this.slideIndex = 0;
    this.paused = false;
    this.started = false;
    
    // assigning the options to internal variables
    this.defaultOptions.merge(options).each(function(option){
      this[option[0]] = option[1];
    }.bind(this));
    
    this.prep();

    if (this.autoPlay) this.play();
    this.fireEvent('initialized', { slideshow: this });
  },
  prep: function(){
    this.root.makePositioned().identify();
    
    for (var i=0; i < this.slides.length; i++) {
      this.prepSlide(this.slides[i]).setStyle({
        position: 'absolute', zIndex: i
      });
    };
    
    if (this.pauseOnMouseover)
      this.root.observe('mouseover', this.pause.bind(this)).observe('mouseout', this.play.bind(this));
    
    this.fireEvent('prepped', { slideshow: this });
  },
  prepSlide: function(slide){
    return slide.setStyle({ display: 'none', opacity: 0 });
  },
  play: function(e){
    // test 1: autoPlay true, pauseOnMouseover true
    // test 2: autoPlay false, pauseOnMouseover true, (manually starting)
    // test 3: autoPlay true, pauseOnMouseover false
    // test 4: autoPlay false, pauseOnMouseover false, (manually starting)
    
    // prevent mousing out from causing the slideshow to start
    if (e && !this.autoPlay && this.pauseOnMouseover && this.loopCount == 0) return;
    
    // if (this.paused) return;
    // prevent against internal mouse movements from triggering a transition
    if (e && this.mouseIsWithinSlideArea(e)) return;
    
    console.log('PLAY');
    
    this.started = true;
    this.paused = false;
    this.transition();
    this.fireEvent('started', { slideshow: this });
  },
  pause: function(e){
    // if it's not started playing, or if it's already paused ,or if the mouse isn't within the slide area return
    if (!this.started || this.paused || !this.mouseIsWithinSlideArea(e)) return;
    console.log('PAUSED');
    this.paused = true;
    this.abortNextTransition();
    
    // queue paused test
    // this.setupPausedTest();
    
    this.fireEvent('paused', { slideshow: this });
  },
  transition: function(){
    console.log('transition');
    if (this.paused) return;
    if (this.nextTransition) this.nextTransition.stop();
    // get slide after visible one, or 1st one if last is visible or none are visible

    this.coming = this.slides[this.slideIndex];
    this.going = this.coming.previous() || this.slides.last();
    
    var coming = this.coming; var going = this.going;
    
    // if not fresh start, fade
    if (going != coming) {
      // if crossfade
      if (this.crossfade) {
        new Effect.Parallel(
          [new Effect.Appear(coming), new Effect.Fade(going)],
          {
            duration: this.transitionDuration,
            afterFinish: function(){
              this.prepSlide(going);
              this.scheduleNextTransition();
            }.bind(this)
          }
        );
      } else {
        going.fade({
          duration: this.transitionDuration / 2,
          afterFinish: function(){
            this.prepSlide(going);
            coming.appear({
              duration: this.transitionDuration / 2,
              afterFinish: this.scheduleNextTransition.bind(this)
            });
          }.bind(this)
        });
      }
    }
    // fade in the first time
    else {
      coming.appear({
        duration: this.transitionDuration / 2,
        afterFinish: this.scheduleNextTransition.bind(this)
      });
    }
    
    this.loopCount++;
    this.slideIndex++;
    if (this.loop && this.slideIndex >= this.slides.length) this.slideIndex = 0;
    
    this.fireEvent('transitioned', { slideshow: this, coming: coming, going: going, loopCount: this.loopCount });
  },
  scheduleNextTransition: function(){
    if (this.slideDuration <= 0) return;
    this.nextTransition = new PeriodicalExecuter(function(nextTransition){
      if (this.paused) return;
      this.transition();
    }.bind(this), this.slideDuration);
  },
  abortNextTransition: function(){
    if (this.nextTransition) this.nextTransition.stop();
  },
  fireEvent: function(name, memo){
    // console.log(this.root.identify() + '_slideshow:' + name);
    this.root.fire(this.root.id + '_slideshow:' + name, memo);
  },
  mouseIsWithinSlideArea: function(e){
    var maxX = this.root.cumulativeOffset().left + this.root.getWidth();
    var minX = this.root.cumulativeOffset().left;
    var maxY = this.root.cumulativeOffset().top + this.root.getHeight();
    var minY = this.root.cumulativeOffset().top;
    if ($R(minX, maxX).include(e.pointerX()) && $R(minY, maxY).include(e.pointerY())) {
      return true; } else { return false; }
  }
  /*,
  setupPausedTest: function(){
    this.schedulePausedTest = function(ev){
      this.pausedTest = new PeriodicalExecuter(function(pe){
        console.log('pausedTest: { paused(' + this.paused + '), !this.mouseIsWithinSlideArea(ev): ' + !this.mouseIsWithinSlideArea(ev));
        if (this.paused && !this.mouseIsWithinSlideArea(ev)) {
          console.log('force play');
          this.play();
        }
        this.pausedTest.stop();
        this.root.stopObserving('mousemove', this.schedulePausedTest);
      }.bind(this), .2);
    }.bind(this);
    this.root.observe('mousemove', this.schedulePausedTest);
  }
  */
});


/*
  
  controls
    previous, next, play, pause, toggle
    numericals?
    keyboard shortcuts?

*/
var SlideShowWithControls = Class.create(SlideShow, {
  initialize: function($super, element, controls, options){
    this.$super = $super;
    this.element = element;
    this.controls = controls;
    this.options = options;
    this.$super(this.element, this.options);
    // console.log($super);
  }
});


