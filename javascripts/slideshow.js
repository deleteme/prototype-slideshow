/*


Main SlideShow Class:

EXAMPLE USAGE:

  new SlideShow('container', { slideDuration: 2 });

*/
var SlideShow = Class.create({
  
  initialize: function(element, options){
    this.element = element;
    this.suppliedOptions = options;
    this.defaultOptions = $H({
      autoPlay:           true,
      slideDuration:      5,
      transitionDuration: 1,
      loop:               true,
      crossFade:          false,
      pauseOnMouseover:   false,
      slidesSelector:     '> *',
      startHidden:        true,
      events: { init: 'dom:loaded', play: 'window:loaded' },
      beforeStart: Prototype.emptyFunction, afterFinish: Prototype.emptyFunction
    });
    
    // assigning the options to internal variables
    this.options = this.defaultOptions.merge(this.suppliedOptions).each(function(option){
      this[option[0]] = option[1];
    }.bind(this));
    
    this.events = $H(this.defaultOptions.get('events')).merge(this.events).toObject();
    
    if (this.autoPlay) {
      this.initEventFunction = function(){
        this.init();
        // only allow the slideShow to observe one 'dom:loaded' event
        if (this.events.init == 'dom:loaded')
          document.stopObserving(this.events.init, this.initEventFunction);
      }.bind(this);
      document.observe(this.events.init, this.initEventFunction);
    }
  },
  
  init: function(){
    if (!$(this.element)) return;
    this.root = $(this.element);
    this.id = this.root.identify();
    this.fireEvent('initializing', { slideShow: this });
    this.slides = $$('#' + String(this.id) + ' ' + String(this.slidesSelector));
    this.loopCount = 0;
    this.slideCount = 0;
    this.slideIndex = 0;
    this.paused = false;
    this.started = false;
    
    this.prep();
    
    this.playEventFunction = function(){
      this.beforeStart();
      this.play();
      if (this.pauseOnMouseover)
        this.root.observe('mouseover', this.pause.bind(this)).observe('mouseout', this.play.bind(this));
      
      // only let window:loaded start the slideShow once
      if (this.events.play == 'window:loaded')
        document.stopObserving(this.events.play, this.playEventFunction);
    }.bind(this);
    document.observe(this.events.play, this.playEventFunction);
    
    this.fireEvent('initialized', { slideShow: this });
  },
  
  prep: function(){
    this.root.makePositioned();
    
    for (var i=0; i < this.slides.length; i++) {
      this.slides[i].setStyle({ position: 'absolute', zIndex: i });
      if (this.startHidden || (!this.startHidden && i != 0))
        this.prepSlide(this.slides[i]);
    };
    this.fireEvent('prepped', { slideShow: this });
  },
  
  prepSlide: function(slide){
    return slide.setStyle({ display: 'none', opacity: 0 });
  },
  
  play: function(e){
    // prevent mousing out from causing the slideShow to start
    if (e && !this.autoPlay && this.pauseOnMouseover && this.loopCount == 0) return;
    
    // prevent against internal mouse movements from triggering a transition
    if (e && this.mouseIsWithinSlideArea(e)) return;
    
    this.started = true;
    this.paused = false;
    this.fireEvent('started', { slideShow: this });
    this.transition();
  },
  
  pause: function(e){
    // if it's not started playing, or if it's already paused, or if the mouse isn't within the slide area return
    if (!this.started || this.paused || (e && !this.mouseIsWithinSlideArea(e))) return;
    
    this.paused = true;
    this.abortNextTransition();
    
    // queue paused test
    // this.setupPausedTest();
    
    this.fireEvent('paused', { slideShow: this });
  },
  
  transition: function(){
    if (this.paused) return;
    if (this.nextTransition) this.nextTransition.stop();
    
    this.coming = this.slides[this.slideIndex];
    this.going = this.coming.previous() || this.slides.last();
    
    var coming = this.coming;
    var going = this.going;
    
    if (this.slideCount > 0 && this.coming == this.slides.first() && this.going == this.slides.last()) {
      this.fireEvent('looped', { slideShow: this });
      this.loopCount++;
      this.afterFinish();
      if (!this.loop) return;
    }
    
    this.slideCount++;
    this.slideIndex++;
    if (this.slideIndex >= this.slides.length) this.slideIndex = 0;
    
    // if not fresh start, fade
    if (going != coming) {
      if (this.crossFade) {
        new Effect.Parallel(
          [new Effect.Appear(coming), new Effect.Fade(going)],
          {
            duration: this.transitionDuration,
            afterFinish: function(){
              this.prepSlide(going);
              this.afterTransitionEffect();
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
              afterFinish: this.afterTransitionEffect.bind(this)
            });
          }.bind(this)
        });
      }
    }
    // fade in the first time
    else {
      coming.appear({
        duration: this.transitionDuration / 2,
        afterFinish: this.afterTransitionEffect.bind(this)
      });
    }
    this.fireEvent('transitioned', { slideShow: this, coming: coming, going: going, loopCount: this.loopCount });
  },
  
  afterTransitionEffect: function(){
    this.scheduleNextTransition();
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
    this.root.fire('SlideShow_' + this.root.id + ':' + name, memo);
  },
  
  mouseIsWithinSlideArea: function(e){
    var offsets = this.root.cumulativeOffset();
    var maxX = offsets.left + this.root.getWidth();
    var minX = offsets.left;
    var maxY = offsets.top + this.root.getHeight();
    var minY = offsets.top;
    
    // minX and the maxY need to be checked like this
    if (minX == e.pointerX() || maxY == e.pointerY()) return false;
    if ($R(minX, maxX).include(e.pointerX()) && $R(minY, maxY).include(e.pointerY())) {
      return true; } else { return false; }
  },
  
  end: function(){
    this.pause();
    document.stopObserving(this.events.play, this.playEventFunction);
    document.stopObserving(this.events.init, this.initEventFunction);
  },
  
  remove: function(){
    this.end();
    this.root.remove();
    this.fireEvent('removed');
  }

});


Event.observe(window, 'load', function(e){
  document.fire('window:loaded');
});

