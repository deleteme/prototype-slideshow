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
    this.defaultOptions = $H({
      autoStart: true,
      duration: 5,
      transition: 'fade',
      transitionDuration: 1,
      loop: true,
      slides: this.root.immediateDescendants(),
      beforeStart: function(){}, afterFinish: function(){}
    });
    this.options = this.defaultOptions.merge(options);
    this.effectOptions = { duration: this.options.get('transitionDuration') / 2 };
    this.slides = this.options.get('slides');
    this.setup();
    if (this.options.get('autoStart')) this.start();
  },
  prep: function(){
    this.root.makePositioned();
    this.slides
      .invoke('setStyle', { display: 'none', position: 'absolute' })
      .each(function(slide, i){ slide.setStyle({ zIndex: i }); });
    this.root.fire(this.root.identify() + '_slideshow:prepped');
  },
  start: function(){
    console.log('start');
    this.transition();
    this.root.fire(this.root.identify() + '_slideshow:started');
  },
  transition: function(){
    
    var coming = this.slides.find(function(slide, i){
      if (slide.getStyle())
        return slide;
    });
    var going = coming.next();
    
    // if not fresh start, fade
    if (!this.fresh) going.fade(this.effectOptions);
    coming.appear(this.effectOptions);

    this.fresh = false;
  }
});