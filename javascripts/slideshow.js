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
      autoStart: true,
      duration: 5,
      transitionDuration: 1,
      loop: true,
      overlap: false,
      slides: this.root.immediateDescendants(),
      beforeStart: function(){}, afterFinish: function(){}
    });
    this.loopCount = 0;
    this.options = this.defaultOptions.merge(options);
    this.effectOptions = { duration: this.options.get('transitionDuration') / 2 };
    this.slides = this.options.get('slides');
    this.prep();
    if (this.options.get('autoStart')) this.start();
    this.fireEvent('initialized', { slideshow: this });
  },
  prep: function(){
    this.root.makePositioned();
    this.slides
      .invoke('setStyle', { display: 'none', position: 'absolute' })
      .each(function(slide, i){ slide.setStyle({ zIndex: i }); });
    this.fireEvent('prepped', { slideshow: this });
  },
  start: function(){
    this.transition();
    this.fireEvent('started', { slideshow: this });
  },
  transition: function(){
    // get slide after visible one, or 1st one if last is visible or none are visible
    var coming = this.slides.find(function(slide){
      if (slide.visible()) return slide.next() || this.slides.first();
    }.bind(this)) || this.slides.first();
    console.log(coming);
    var going = coming.previous() || this.slides.first();
    
    // if not fresh start, fade
    if (going != coming) {
      // if overlap
      if (this.options.get('overlap')) {
        new Effect.Parallel([new Effect.Appear(coming), new Effect.Fade(going)], { duration: this.options.get('transitionDuration') });
      } else {
        going.fade(this.effectOptions.merge({
          afterFinish: function(){
            coming.appear(this.effectOptions);
          }.bind(this)
        }));
      }
    }
    // fade in the first time
    else {
      coming.appear(this.effectOptions);
    }
    
    
    this.loopCount++;
    this.fireEvent('transitioned', { slideshow: this, coming: coming, going: going });
  },
  fireEvent: function(name, memo){
    console.group(name);
    console.log(memo);
    console.groupEnd();
    this.root.fire(this.root.identify() + '_slideshow:' + name, memo);
  }
});