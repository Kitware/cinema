(function () {
   cinema.decorators.Probe = function (rootModel) {
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

      // FIXME handle time or other parameter
      var sliceValues = this.get('slices'),
         size = sliceValues.length,
         imageArray = [],
         that = this,
         imageCache = this.get('_imageCache');

      function imageReady() {
         that.get('_progress').ready++;
         cinema.events.trigger('progress');
      }

      if(imageCache.hasOwnProperty(fieldName) && sliceValues.length === imageCache[fieldName].length) {
         return; // Already loaded
      }

      imageCache[fieldName] = imageArray;
      that.get('_progress').expect += size;
      for (var idx = 0; idx < size; ++idx) {
         var image = new Image();
         image.onload = imageReady;
         image.src = this.basePath + '/' + this.getFilePattern({ field: fieldName, slice: sliceValues[idx]});
         imageArray.push(image);
      }
   };

   prototype.setActiveField = function (fieldName) {
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
      return this.get('_imageCache')[this.getActiveField()][Math.floor(sliceIdx / this.getSpriteSize())];
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

      // console.log('pixOffset: ' + pixOffset + ' | ' + delta + ' | ' + value + ' => ' + (value*delta + range[0]) + ' | ' + range.join(', '));

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

}());
