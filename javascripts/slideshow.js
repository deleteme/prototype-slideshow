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
    this.slides
      .invoke('setStyle', { display: 'none', position: 'absolute', opacity: 0 })
      .each(function(slide, i){ slide.setStyle({ zIndex: i }); });
    this.fireEvent('prepped', { slideshow: this });
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
    var coming = this.slides.find(function(slide){ return slide.visible(); });
    this.coming = (coming) ? coming.next() : this.slides.first();
    
    this.going = this.coming.previous() || this.slides.first();
    // if not fresh start, fade
    if (this.going != this.coming) {
      // this.coming.show();
      // if crossfade
      if (this.options.get('crossfade')) {
        new Effect.Parallel(
          [new Effect.Appear(this.coming.show()), new Effect.Fade(this.going)],
          {
            duration: this.options.get('transitionDuration'),
            afterFinish: Element.hide.curry(this.going)
          }
        );
        console.group('transition: ' + this.loopCount);
        console.log('coming: ' + this.coming.down().readAttribute('alt'));
        console.log('going: ' + this.going.down().readAttribute('alt'));
        console.groupEnd();
      } else {
        this.going.fade(this.effectOptions.merge({
          afterFinish: function(){
            console.log('this.going is faded out');
            this.going.hide();
            this.coming.show().appear({afterFinish: function(){
              console.log(this.coming);
            }});
          }.bind(this)
        }));
        console.group('transition: ' + this.loopCount);
        console.log('coming: ' + this.coming.down().readAttribute('alt'));
        console.log('going: ' + this.going.down().readAttribute('alt'));
        console.groupEnd();
      }
    }
    // fade in the first time
    else {
      console.log('fade in the first time');
      console.group('transition: ' + this.loopCount);
      console.log('coming: ' + this.coming.down().readAttribute('alt'));
      console.log('going: ' + this.going.down().readAttribute('alt'));
      console.groupEnd();
      
      this.coming.appear(this.effectOptions);
    }
    
    this.loopCount++;
    this.fireEvent('transitioned', { slideshow: this, coming: this.coming, going: this.going, loopCount: this.loopCount });
    if (this.options.get('slideDuration') > 0)
      this.transition.bind(this).delay(this.options.get('slideDuration'));
  },
  fireEvent: function(name, memo){
    this.root.fire(this.root.identify() + '_slideshow:' + name, memo);
  }
});