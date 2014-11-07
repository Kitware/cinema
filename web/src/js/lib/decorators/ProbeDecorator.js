(function () {
   cinema.decorators.Probe = function (rootModel) {
      var self = this;
      rootModel.set('_imageCache', {});
      rootModel.set('_progress', { "expect": 0, "ready": 0 });
      rootModel.set('active_field', rootModel.get('fields')[0]);

      return _.extend(rootModel, this);
   };

   var prototype = cinema.decorators.Probe.prototype;


   // Public methods ---------------------------------------------------------

   prototype.getFields = function () {
      return this.get('fields');
   };

   prototype.getSpriteSize = function () {
      return this.get('sprite_size');
   };

   prototype.loadFieldImages = function (fieldName) {
      if(fieldName === undefined) {
         fieldName = this.getActiveField();
      }

      var sliceValues = this.get('slices'),
         size = sliceValues.length,
         imageArray = [],
         that = this,
         imageCache = this.get('_imageCache'),
         controls = this.getControls();

      // Update field name
      controls.field = fieldName;
      controls.slice = "key";

      if(this.getFilePattern(controls).indexOf('undefined') != -1) {
         return;
      }

      function imageReady() {
         that.get('_progress').ready++;
         cinema.events.trigger('progress');
      }

      if(imageCache.hasOwnProperty(fieldName) && sliceValues.length === imageCache[fieldName].length) {
         return; // Already loaded
      }

      imageCache[this.getFilePattern(controls)] = imageArray;
      that.get('_progress').expect += size;
      for (var idx = 0; idx < size; ++idx) {
         // Update active slice
         controls.slice = sliceValues[idx];

         var image = new Image();
         image.onload = imageReady;
         image.src = this.basePath + '/' + this.getFilePattern(controls);
         imageArray.push(image);
      }
   };

   prototype.setActiveField = function (fieldName) {
      this.loadFieldImages(fieldName);
      this.set('active_field', fieldName);
   };

   prototype.getActiveField = function () {
      return this.get('active_field');
   };

   prototype.getSpacing = function () {
      return this.get('spacing');
   };

   prototype.getDimensions = function () {
      return this.get('dimensions');
   };

   prototype.getProgress = function() {
      var progress = this.get('_progress');
      return 100 * progress.ready / progress.expect;
   };

   prototype.getImage = function (sliceIdx) {
      var controls = this.getControls(),
         array = null;

      controls.field = this.getActiveField();
      controls.slice = "key";
      array = this.get('_imageCache')[this.getFilePattern(controls)];

      return (array === undefined) ? null : array[Math.floor(sliceIdx / this.getSpriteSize())];
   };

   prototype.getYOffset = function (sliceIdx) {
      return this.getSpriteSize() - sliceIdx % this.getSpriteSize() - 1;
   };

   prototype.getMaxSize = function () {
      var max = -1,
         dims = this.get('dimensions'),
         count = 3;

      while(count--) {
         max = (max < dims[count]) ? dims[count] : max;
      }

      return max;
   };

   prototype.getCenterSlice = function () {
      var dims = this.get('dimensions');
      return [ dims[0]/2, dims[1]/2, dims[2]/2 ];
   };

   prototype.getPixelValue = function (buffer, pixOffset) {
      var range = this.get('ranges')[this.getActiveField()],
         delta = (range[1] - range[0]) / (16777216), // 256*256*256
         value = buffer[pixOffset] + (buffer[pixOffset+1]*256) + (buffer[pixOffset+2]*256*256);

      return value*delta + range[0];
   };

   prototype.setLayout = function (layoutName) {
      this.set('layout_name', layoutName);
   };

   prototype.getLayout = function () {
      var layout = this.get('layout_name');
      return layout ? layout : '2x2';
   };

   prototype.setGlobalRangeForChart = function (fullRange) {
      this.set('global_range', !!fullRange);
   };

   prototype.getGlobalRangeForChart = function () {
      var value = this.get('global_range');
      return (value === undefined) ? true : value;
   };

   prototype.validateImageCache = function() {
      var controls = this.getControls(),
         cache = this.get('_imageCache');

      controls.field = this.getActiveField();
      controls.slice = "key";

      if(cache.hasOwnProperty(this.getFilePattern(controls))) {
         return true
      }

      // The cache is not ready, fill it
      this.loadFieldImages();

      return false;
   }

}());
