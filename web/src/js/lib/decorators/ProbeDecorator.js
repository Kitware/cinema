(function () {
   var imageCache = {},
      progress = { "expect": 0, "ready": 0 };

   cinema.decorators.Probe = function (rootModel) {
      var dims = rootModel.get('dimensions');

      this.activeField = rootModel.get('fields')[0];
      this.globalRange = true;
      this.layoutName = '2x2';
      this.layoutModel = {
         split: [ 0.5, 0.5 ],
         slicePosition: [ dims[0]/2, dims[1]/2, dims[2]/2 ],
         spacing: 10,
         viewTypes: [ 'XY', 'ZY', 'XZ', 'ChartX', 'ChartY', 'ChartZ', 'Stats'],
         viewports: [
            { center: [250, 250], zoom: 0.5, view: 'XY', stats: true},
            { center: [250, 250], zoom: 0.5, view: 'ZY', stats: false},
            { center: [250, 250], zoom: 0.5, view: 'XZ', stats: false},
            { center: [250, 250], zoom: 0.5, view: 'ChartX', stats: false}
         ]
      };

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
         controls = this.getControls();

      // Update field name
      controls.field = fieldName;
      controls.slice = "key";

      if(this.getFilePattern(controls).indexOf('undefined') !== -1) {
         return;
      }

      function imageReady() {
         /*jshint -W016 */
         progress.ready++;
         cinema.events.trigger('progress');
      }

      if(imageCache.hasOwnProperty(fieldName) && sliceValues.length === imageCache[fieldName].length) {
         return; // Already loaded
      }

      imageCache[this.getFilePattern(controls)] = imageArray;
      progress.expect += size;
      /*jshint -W016 */
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
      this.activeField = fieldName;
   };

   prototype.getActiveField = function () {
      return this.activeField;
   };

   prototype.getSpacing = function () {
      return this.get('spacing');
   };

   prototype.getDimensions = function () {
      return this.get('dimensions');
   };

   prototype.getProgress = function() {
      return 100 * progress.ready / progress.expect;
   };

   prototype.getImage = function (sliceIdx) {
      var controls = this.getControls(),
         array = null;

      controls.field = this.getActiveField();
      controls.slice = "key";
      array = imageCache[this.getFilePattern(controls)];

      return (array === undefined) ? null : array[Math.floor(sliceIdx / this.getSpriteSize())];
   };

   prototype.getYOffset = function (sliceIdx) {
      return this.getSpriteSize() - sliceIdx % this.getSpriteSize() - 1;
   };

   prototype.getMaxSize = function () {
      var max = -1,
         dims = this.get('dimensions'),
         count = 3;

      /*jshint -W016 */
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
      this.layoutName = layoutName;
      this.trigger('probe-change');
   };

   prototype.getLayout = function () {
      return this.layoutName;
   };

   prototype.setGlobalRangeForChart = function (fullRange) {
      this.globalRange = !!fullRange;
      this.trigger('probe-change');
   };

   prototype.getGlobalRangeForChart = function () {
      return this.globalRange;
   };

   prototype.validateImageCache = function() {
      var controls = this.getControls(),
         cache = imageCache;

      controls.field = this.getActiveField();
      controls.slice = "key";

      if(cache.hasOwnProperty(this.getFilePattern(controls))) {
         return true;
      }

      // The cache is not ready, fill it
      this.loadFieldImages();

      return false;
   };

   prototype.getLayoutModel = function() {
      return this.layoutModel;
   };

}());
