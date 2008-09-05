/*


Main SlideShow Class:

* slides
* transitions, default: fade
* slide visibility duration, default: 5
* transition duration, default: 1
* loop boolean, default: true


new SlideShow('container', { duration: 2 });

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
      slides: this.root.immediateDescendants(),
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
    this.root.makePositioned();
    
    for (var i=0; i < this.slides.length; i++) {
      this.prepSlide(this.slides[i]).setStyle({
        position: 'absolute', zIndex: i
      });
    };
    
    this.fireEvent('prepped', { slideshow: this });
  },
  prepSlide: function(slide){
    return slide.setStyle({ display: 'none', opacity: 0 });
  },
  play: function(){
    this.paused = false;
    this.transition();
    this.fireEvent('started', { slideshow: this });
  },
  pause: function(){
    this.paused = true;
  },
  transition: function(){
    if (this.paused) return;
    // get slide after visible one, or 1st one if last is visible or none are visible

    this.coming = this.slides[this.slideIndex];
    this.going = this.coming.previous() || this.slides.last();
    
    // if not fresh start, fade
    if (this.going != this.coming) {
      // if crossfade
      if (this.options.get('crossfade')) {
        new Effect.Parallel(
          [new Effect.Appear(this.coming), new Effect.Fade(this.going)],
          {
            duration: this.options.get('transitionDuration'),
            afterFinish: this.prepSlide.curry(this.going)
          }
        );
      } else {
        this.going.fade({
          duration: this.options.get('transitionDuration') / 2,
          afterFinish: function(){
            this.prepSlide(this.going);
            this.coming.appear(this.effectOptions);
          }.bind(this)
        });
      }
    }
    // fade in the first time
    else {
      this.coming.appear(this.effectOptions);
    }
    
    this.loopCount++;
    this.slideIndex++;
    if (this.slideIndex >= this.slides.length)
      this.slideIndex = 0;
    this.fireEvent('transitioned', { slideshow: this, coming: this.coming, going: this.going, loopCount: this.loopCount });
    if (this.options.get('slideDuration') > 0)
      this.transition.bind(this).delay(this.options.get('slideDuration'));
  },
  fireEvent: function(name, memo){
    this.root.fire(this.root.identify() + '_slideshow:' + name, memo);
  }
});