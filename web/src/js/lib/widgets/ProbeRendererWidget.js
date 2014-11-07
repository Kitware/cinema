cinema.views.ProbeRendererWidget = Backbone.View.extend({
   initialize: function (settings) {
      var self = this;

      this.model = settings.model;
      this.renderingModel = settings.renderingModel;
      this.maxSize = this.model.getMaxSize();
      this.model.loadFieldImages();
      this.slicePosition = this.model.getCenterSlice();
      this.lineValues = { x: [], y: [], z: [], probe: null };
      this.bg = { xIdx: 0, yIdx: 1 };
      this.layout = {
         split: [ 0.5, 0.5 ],
         spacing: 10,
         viewTypes: [ 'XY', 'ZY', 'XZ', 'ChartX', 'ChartY', 'ChartZ', 'Stats'],
         viewports: [
            { center: [250, 250], zoom: 0.5, view: 'XY', stats: true},
            { center: [250, 250], zoom: 0.5, view: 'ZY', stats: false},
            { center: [250, 250], zoom: 0.5, view: 'XZ', stats: false},
            { center: [250, 250], zoom: 0.5, view: 'ChartX', stats: false}
         ]
      };

      // Event management
      cinema.bindWindowResizeHandler(this, this.render, 200);

      cinema.events.on('progress', function() {
         self.render();
      });

      this.model.on('change', function() {
         this.render();
      }, this);
   },

   drawChart: function (axis, viewport, values, range, ctx) {
      if(values === undefined) {
         return;
      }

      var axisToIdx = { 'X': 0, 'Y': 1, 'Z': 2 },
         length = values.length,
         deltaH = range[1] - range[0],
         dimensions = this.model.getDimensions(),
         height = viewport.area[3],
         width = viewport.area[2],
         lineOffset = 2,
         lineHeight = 10,
         lines = [
            "Data Range along TT: [RR]".replace(/RR/g, range.join(', ')).replace(/TT/g, axis),
            "Probe value: RR".replace(/RR/g, '' + this.lineValues.probe),
            "Probe Field: RR".replace(/RR/g, this.model.getActiveField()),
            "Probe cooridnates: [RR]".replace(/RR/g, this.slicePosition.join(', '))
         ],
         probePosition = Math.floor(viewport.area[0] + width * this.slicePosition[axisToIdx[axis]] / dimensions[axisToIdx[axis]]);

      function lineTo(idx) {
         ctx.lineTo( Math.floor(width * idx / length + viewport.area[0]),
            Math.floor((1 - ((values[idx] - range[0]) / deltaH)) * (height-20) + viewport.area[1] + 15));
      }

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.fillStyle="#000000";
      ctx.strokeStyle = '#000000';
      ctx.moveTo(viewport.area[0], viewport.area[1]);
      for(var i = 0; i < length; ++i) {
         lineTo(i);
      }
      ctx.stroke();

      // Draw red cursor
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FF0000';
      ctx.moveTo(probePosition, viewport.area[1]);
      ctx.lineTo(probePosition, viewport.area[1] + viewport.area[3]);
      ctx.stroke();

      ctx.font=lineHeight + "px Verdana";
      if(!viewport.stats) {
         lines.pop();
         lines.pop();
      }
      while(lines.length) {
         ctx.fillText(lines.shift(), viewport.area[0] + 10, viewport.area[1] + (lineOffset++ * lineHeight * 1.2));
      }
   },

   computeLayout: function () {
      var canvas = this.$('.fg-renderer'),
         width = canvas.attr('width'),
         height = canvas.attr('height'),
         center = [ Math.floor(width * this.layout.split[0]), Math.floor(height * this.layout.split[1])],
         spacing = this.layout.spacing,
         layoutFunctions = {
            "2x2": function () {
               return [
                  [  spacing,
                     spacing,
                     center[0] - (1.5*spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     center[0] + .5*spacing,
                     spacing,
                     width - center[0] - (1.5*spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     spacing,
                     center[1] + 0.5 * spacing,
                     center[0] - (1.5 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ], [
                     center[0] + 0.5 * spacing,
                     center[1] + 0.5 * spacing,
                     width - center[0] - (1.5 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ]
               ];
            },
            "1x1": function () {
               return [[
                  spacing,
                  spacing,
                  width - (2 * spacing),
                  height - (2 * spacing)
               ]];
            },
            "1x2": function () {
               return [
                  [  spacing,
                     spacing,
                     width - (2 * spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     spacing,
                     center[1] + 0.5 * spacing,
                     width - (2 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ]
               ];
            },
            "2x1": function () {
               return [
                  [  spacing,
                     spacing,
                     center[0] - (1.5*spacing),
                     height - (2 * spacing)
                  ], [
                     center[0] + .5*spacing,
                     spacing,
                     width - center[0] - (1.5*spacing),
                     height - (2 * spacing)
                  ]
               ];
            },
            "3xT": function () {
               return [
                  [  spacing,
                     spacing,
                     width - (2 * spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     spacing,
                     center[1] + 0.5 * spacing,
                     center[0] - (1.5 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ], [
                     center[0] + 0.5 * spacing,
                     center[1] + 0.5 * spacing,
                     width - center[0] - (1.5 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ]
               ];
            },
            "3xL": function () {
               return [
                  [  spacing,
                     spacing,
                     center[0] - (1.5*spacing),
                     height - (2 * spacing)
                  ], [
                     center[0] + .5*spacing,
                     spacing,
                     width - center[0] - (1.5*spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     center[0] + 0.5 * spacing,
                     center[1] + 0.5 * spacing,
                     width - center[0] - (1.5 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ]
               ];
            },
            "3xR": function () {
               return [
                  [  spacing,
                     spacing,
                     center[0] - (1.5*spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     center[0] + .5*spacing,
                     spacing,
                     width - center[0] - (1.5*spacing),
                     height - (2 * spacing)
                  ], [
                     spacing,
                     center[1] + 0.5 * spacing,
                     center[0] - (1.5 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ]
               ];
            },
            "3xB": function () {
               return [
                  [  spacing,
                     spacing,
                     center[0] - (1.5*spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     center[0] + .5*spacing,
                     spacing,
                     width - center[0] - (1.5*spacing),
                     center[1] - (1.5*spacing)
                  ], [
                     spacing,
                     center[1] + 0.5 * spacing,
                     width - (2 * spacing),
                     height - center[1] - (1.5 * spacing)
                  ]
               ];
            }
         };

      return layoutFunctions[this.model.getLayout()]();
   },

   attachMouseListener: function(container) {
      function capValue(value, max) {
         return (value < 0) ? 0 : (value >= max) ? max - 1 : value;
      }

      var viewports = this.layout.viewports,
         mouseDown = false,
         dimensions = this.model.getDimensions(),
         split = this.layout.split,
         probe = this.slicePosition,
         that = this,
         downEvent = null,
         activeViewport = null,
         probeUpdater = {
            'XY' : function(xyViewport) {
               var workArea = xyViewport[2].workArea,
                  xy = xyViewport;

               probe[0] = capValue(Math.floor(dimensions[0] * (xy[0] - workArea[0]) / workArea[2]), dimensions[0]);
               probe[1] = capValue(Math.floor(dimensions[1] * (xy[1] - workArea[1]) / workArea[3]), dimensions[1]);
            },
            'ZY' : function (xyViewport) {
               var workArea = xyViewport[2].workArea,
                  xy = xyViewport;

               probe[2] = capValue(Math.floor(dimensions[2] * (xy[0] - workArea[0]) / workArea[2]), dimensions[2]);
               probe[1] = capValue(Math.floor(dimensions[1] * (xy[1] - workArea[1]) / workArea[3]), dimensions[1]);
            },
            'XZ' : function (xyViewport) {
               var workArea = xyViewport[2].workArea,
                  xy = xyViewport;

               probe[0] = capValue(Math.floor(dimensions[0] * (xy[0] - workArea[0]) / workArea[2]), dimensions[0]);
               probe[2] = capValue(Math.floor(dimensions[2] * (xy[1] - workArea[1]) / workArea[3]), dimensions[2]);
            },
            'ChartX' : function (xyViewport) {
               var width = xyViewport[2].area[2],
                  xOffset = xyViewport[2].area[0],
                  xy = xyViewport;

               probe[0] = capValue(Math.floor(dimensions[0] * (xy[0] - xOffset) / width), dimensions[0]);
            },
            'ChartY' : function (xyViewport) {
               var width = xyViewport[2].area[2],
                  xOffset = xyViewport[2].area[0],
                  xy = xyViewport;

               probe[1] = capValue(Math.floor(dimensions[1] * (xy[0] - xOffset) / width), dimensions[1]);
            },
            'ChartZ' : function (xyViewport) {
               var width = xyViewport[2].area[2],
                  xOffset = xyViewport[2].area[0],
                  xy = xyViewport;

               probe[2] = capValue(Math.floor(dimensions[2] * (xy[0] - xOffset) / width), dimensions[2]);
            }
         };

      function getViewPort(x,y) {
         var count = viewports.length;
         while(count--) {
            var area = viewports[count].area;
            if(x >= area[0] && y >= area[1] && x <= (area[0]+area[2]) && y <= (area[1]+area[3])) {
               return viewports[count];
            }
         }
         return null;
      }

      function processEvent(event, extractViewport) {
         var elem_position = $(event.delegateTarget).offset(),
            height = $(event.delegateTarget).height(),
            width = $(event.delegateTarget).width(),
            x = (event.pageX - elem_position.left),
            y = (event.pageY - elem_position.top);
         return [x, y, extractViewport ? getViewPort(x, y) : null, x / width, y / height];
      }

      container.off()
         .on('mousedown', function(event) {
            mouseDown = true;
            downEvent = processEvent(event, true);
            that.$('.dropdown-menu').hide();
         })
         .on('mouseup', function() {
            mouseDown = false;
         })
         .on('mousemove', function(event) {
            if(mouseDown) {
               var xy = processEvent(event, false);
               downEvent[0] = xy[0];
               downEvent[1] = xy[1];
               if(downEvent[2]) {
                  if (probeUpdater.hasOwnProperty(downEvent[2].view)) {
                     probeUpdater[downEvent[2].view](downEvent);
                  }
               } else {
                  // Change center
                  split[0] = xy[3];
                  split[1] = xy[4];
               }
               that.drawLayout();
            }
         })
         .on('dblclick contextmenu', function(event) {
            var xyViewport = processEvent(event, true);
            activeViewport = xyViewport[2];
            if(activeViewport.stats) {
               that.$('li[view-type="toggleInfo"]').addClass('showStats');
            } else {
               that.$('li[view-type="toggleInfo"]').removeClass('showStats');
            }

            that.$('.dropdown-menu').css('left', xyViewport[0] + 'px').css('top', xyViewport[1] + 'px').show();

            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            event.cancelBubble = true;  // IE events
            event.returnValue = false;  // IE events

            return false;
         })
         .on("mousewheel  MozMousePixelScroll", function(event){ // DOMMouseScroll
            var scrollValue = (event.originalEvent.wheelDeltaY || -event.originalEvent.detail),
               viewport = processEvent(event, true)[2];

            if(viewport && viewport.view === 'XY') {
               probe[2] += (scrollValue > 0 ? 1 : -1);
               probe[2] = (probe[2] < 0) ? 0 : (probe[2] >= dimensions[2]) ? dimensions[2] - 1 : probe[2];
               that.drawLayout();

               if (event.preventDefault) event.preventDefault();
               if (event.stopPropagation) event.stopPropagation();
               event.cancelBubble = true;  // IE events
               event.returnValue = false;  // IE events

               return false;
            }
         });


         this.$('.dropdown-menu > li').on('click', function() {
            var me = $(this),
               viewType = me.attr('view-type'),
               active = me.hasClass('showStats');
            if(activeViewport && viewType) {
               if(viewType === 'toggleInfo') {
                  activeViewport.stats = !active;
                  me.toggleClass('showStats')
                  that.drawLayout();
               } else {
                  activeViewport.view = viewType;
                  that.drawLayout();
               }

            }
            that.$('.dropdown-menu').hide();
         });
   },

   render: function () {
      var width = this.$el.width(),
         height = this.$el.height(),
         that = this;

      this.$el.html(cinema.templates.probeRenderer( { maxSize: this.maxSize, width: width, height: height }));
      if(this.drawLayout()) {
         // Auto attach and remove
         this.attachMouseListener(this.$('.fg-renderer'));
      } else {
         this.drawProgress();
      }
   },

   drawProgress: function() {
      var canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d'),
         width = canvas.attr('width'),
         height = canvas.attr('height'),
         progress = this.model.getProgress(),
         barLength = (width-40) * progress / 100;

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.fillStyle="#000000";
      ctx.strokeStyle = '#000000';
      ctx.clearRect(0,0,width,height);
      ctx.fillRect(20, (height - 20)/2 , barLength, 20);
      ctx.beginPath()
      ctx.rect(20, (height - 20)/2 , width - 40, 20);
      ctx.stroke();

      if(progress === 100) {
         this.drawLayout();
      }
   },

   drawLayout: function() {
      var canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d'),
         width = canvas.attr('width'),
         height = canvas.attr('height'),
         layout = this.layout,
         dataInCache = this.model.validateImageCache(),
         progress = this.model.getProgress(),
         viewportCoordinates = this.computeLayout(),
         count = 0,
         drawMap = {},
         drawPriority = [ 'renderXY', 'renderZY', 'renderXZ' ];

      if( (!dataInCache) && progress < 100) {
         return false;
      }

      // Make sure the size Match
      while(layout.viewports.length < viewportCoordinates.length) {
         layout.viewports.push({ center: [250, 250], zoom: 0.5, view: 'XY', stats: false});
      }
      while(layout.viewports.length > viewportCoordinates.length) {
         layout.viewports.pop();
      }

      // Update viewport area + register renderCalls needed
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.fillStyle="#000000";
      ctx.strokeStyle = '#000000';
      count = viewportCoordinates.length;
      while(count--) {
         var area = viewportCoordinates[count],
            viewport = layout.viewports[count],
            renderMethodName = 'render' + viewport.view;
         viewport.area = area;
         ctx.rect(area[0], area[1], area[2], area[3]);

         // Register viewport for rendering
         drawMap[renderMethodName] = (drawMap[renderMethodName] || []).concat(viewport);
      }
      ctx.stroke();

      // Reset line probing
      this.lineValues = {};

      // Render to BG in proper order + push to front buffer
      count = drawPriority.length;
      for(var i = 0; i < drawPriority.length; ++i) {
         var array = drawMap[drawPriority[i]];
         if(array) {
            this[drawPriority[i]]();
            count = array.length;
            while(count--) {
               this.pushImageToForeground(array[count], this.bg.xIdx, this.bg.yIdx);
            }
         }
      }

      // Draw chart if any
      var dependencies = [
         ['renderChartX', 'x', 'renderXY'],
         ['renderChartY', 'y', 'renderXY'],
         ['renderChartZ', 'z', 'renderXZ']
      ];
      for(var i = 0; i < dependencies.length; ++i) {
         var dep = dependencies[i];
         if(drawMap[dep[0]]) {
            if(!this.lineValues.hasOwnProperty(dep[1])) {
               this[dep[2]]();
            }
            count = drawMap[dep[0]].length;
            while(count--) {
               this[dep[0]](drawMap[dep[0]][count]);
            }
         }
      }

      return true;
   },

   pushImageToForeground: function(viewport, xIdx, yIdx) {
      var xyz = this.slicePosition,
         dimensions = this.model.getDimensions(),
         spacing = this.model.getSpacing(),
         bgCanvas = this.$('.bg-renderer'),
         bgCtx = bgCanvas[0].getContext('2d'),
         canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d'),
         scaleX = dimensions[xIdx] * spacing[xIdx] / viewport.area[2],
         scaleY = dimensions[yIdx] * spacing[yIdx] / viewport.area[3],
         scale = (scaleX > scaleY) ? scaleX : scaleY,
         destWidth  = Math.floor(dimensions[xIdx] * spacing[xIdx] / scale),
         destHeight = Math.floor(dimensions[yIdx] * spacing[yIdx] / scale);

      // Rescale generated image to viewport / center / zoom
      ctx.drawImage(bgCanvas[0],
         0,
         0,
         dimensions[xIdx],
         dimensions[yIdx],
         (viewport.area[2] - destWidth)/2 + viewport.area[0],
         (viewport.area[3] - destHeight)/2 + viewport.area[1],
         destWidth,
         destHeight);

      viewport.workArea = [
         (viewport.area[2] - destWidth)/2 + viewport.area[0],
         (viewport.area[3] - destHeight)/2 + viewport.area[1],
         destWidth,
         destHeight ];

      // Draw position
      ctx.beginPath();
      var scaledValue = destWidth * xyz[xIdx] / dimensions[xIdx] + viewport.workArea[0];
      ctx.moveTo(
         scaledValue,
         viewport.area[1]);
      ctx.lineTo(
         scaledValue,
         viewport.area[1] + viewport.area[3]);
      scaledValue = destHeight * xyz[yIdx] / dimensions[yIdx] + viewport.workArea[1];
      ctx.moveTo(
         viewport.area[0],
         scaledValue);
      ctx.lineTo(
         viewport.area[0] + viewport.area[2],
         scaledValue);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if(viewport.stats) {
         this.drawStatistics(viewport);
      }
   },

   extractHorizontalLineValues: function(pixBuffer, axis) {
      if(!this.lineValues.hasOwnProperty(axis)) {
         var dimensions = this.model.getDimensions(),
            xyz = this.slicePosition,
            offset = dimensions[this.bg.xIdx] * xyz[this.bg.yIdx] * 4,
            length = dimensions[this.bg.xIdx] * 4,
            idx = 0,
            min = Number.MAX_VALUE,
            max = Number.MIN_VALUE;

         this.lineValues[axis] = [];
         while(idx < length) {
            var value = this.model.getPixelValue(pixBuffer, offset + idx);
            min = (min < value) ? min : value;
            max = (max > value) ? max : value;
            this.lineValues[axis].push(value);
            idx += 4;
         }

         this.lineValues[axis + 'Range'] = [min, max];
      }
   },

   extractVerticalLineValues: function(pixBuffer, axis) {
      if(!this.lineValues.hasOwnProperty(axis)) {
         var dimensions = this.model.getDimensions(),
            xyz = this.slicePosition,
            offset = xyz[this.bg.xIdx] * 4,
            delta = dimensions[this.bg.xIdx] * 4,
            length = dimensions[this.bg.yIdx] * delta,
            idx = 0,
            min = Number.MAX_VALUE,
            max = Number.MIN_VALUE;

         this.lineValues[axis] = [];
         while(idx < length) {
            var value = this.model.getPixelValue(pixBuffer, offset + idx);
            min = (min < value) ? min : value;
            max = (max > value) ? max : value;
            this.lineValues[axis].push(value);
            idx += delta;
         }

         this.lineValues[axis + 'Range'] = [min, max];
      }
   },

   renderXY: function() {
      if(this.model.getProgress() < 100) {
         return;
      }

      var xyz = this.slicePosition,
         dimensions = this.model.getDimensions(),
         image = this.model.getImage(xyz[2]),
         offset = this.model.getYOffset(xyz[2]),
         bgCanvas = this.$('.bg-renderer'),
         bgCtx = bgCanvas[0].getContext('2d');

      // Let the system know which dimension is on which axis
      this.bg.xIdx = 0;
      this.bg.yIdx = 1;

      // Loading data
      if(image === null) {
         return;
      }

      // Draw in bg image at scale 1
      bgCtx.drawImage(image, 0, dimensions[1]*offset, dimensions[0], dimensions[1], 0, 0, dimensions[0], dimensions[1]);

      // Extract line values
      var pixBuffer = bgCtx.getImageData(0,0,dimensions[0], dimensions[1]).data;
      this.lineValues.probe = this.model.getPixelValue(pixBuffer, (xyz[0] * 4) + (dimensions[0] * xyz[1] * 4));

      this.extractHorizontalLineValues(pixBuffer, 'x');
      this.extractVerticalLineValues(pixBuffer, 'y');

      // Apply colors
      this.applyLUT();
   },

   renderZY: function() {
      if(this.model.getProgress() < 100) {
         return;
      }

      var xyz = this.slicePosition,
         dimensions = this.model.getDimensions(),
         bgCanvas = this.$('.bg-renderer'),
         bgCtx = bgCanvas[0].getContext('2d'),
         activeColumn = dimensions[2];

      // Let the system know which dimension is on which axis
      this.bg.xIdx = 2;
      this.bg.yIdx = 1;

      // Loading data
      if(this.model.getImage(activeColumn-1) === null) {
         return;
      }

      // Render in BG
      while(activeColumn--) {
         var offset = this.model.getYOffset(activeColumn),
            image = this.model.getImage(activeColumn);

         bgCtx.drawImage(image,
            xyz[0], dimensions[1]*offset,
            1, dimensions[1],
            activeColumn, 0, 1, dimensions[1]);
      }

      // Extract line values
      var pixBuffer = bgCtx.getImageData(0,0,dimensions[2], dimensions[1]).data;
      this.lineValues.probe = this.model.getPixelValue(pixBuffer, (xyz[2] * 4) + (dimensions[2] * xyz[1] * 4));

      this.extractHorizontalLineValues(pixBuffer, 'z');
      this.extractVerticalLineValues(pixBuffer, 'y');

      // Apply colors
      this.applyLUT();
   },

   renderXZ: function() {
      if(this.model.getProgress() < 100) {
         return;
      }

      var xyz = this.slicePosition,
         dimensions = this.model.getDimensions(),
         bgCanvas = this.$('.bg-renderer'),
         bgCtx = bgCanvas[0].getContext('2d'),
         activeLine = dimensions[2];

      // Let the system know which dimension is on which axis
      this.bg.xIdx = 0;
      this.bg.yIdx = 2;

      // Loading data
      if(this.model.getImage(activeLine-1) === null) {
         return;
      }

      while(activeLine--) {
         var offset = this.model.getYOffset(activeLine),
            image = this.model.getImage(activeLine);

         bgCtx.drawImage(image,
            0, dimensions[1]*offset + xyz[1],
            dimensions[0], 1,
            0, activeLine, dimensions[0], 1);
      }

      // Extract line values
      var pixBuffer = bgCtx.getImageData(0,0,dimensions[0], dimensions[2]).data;
      this.lineValues.probe = this.model.getPixelValue(pixBuffer, (xyz[0] * 4) + (dimensions[0] * xyz[2] * 4));

      this.extractHorizontalLineValues(pixBuffer, 'x');
      this.extractVerticalLineValues(pixBuffer, 'z');

      // Apply colors
      this.applyLUT();
   },

   renderChartX: function(viewport) {
      var values = this.lineValues.x,
         range = this.model.getGlobalRangeForChart() ? this.model.get('ranges')[this.model.getActiveField()] : this.lineValues.xRange,
         canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d');

      this.drawChart('X', viewport, values, range, ctx);
   },

   renderChartY: function(viewport) {
      var values = this.lineValues.y,
         range = this.model.getGlobalRangeForChart() ? this.model.get('ranges')[this.model.getActiveField()] : this.lineValues.yRange,
         canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d');

      this.drawChart('Y', viewport, values, range, ctx);
   },

   renderChartZ: function(viewport) {
      var values = this.lineValues.z,
         range = this.model.getGlobalRangeForChart() ? this.model.get('ranges')[this.model.getActiveField()] : this.lineValues.zRange,
         canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d');

      this.drawChart('Z', viewport, values, range, ctx);
   },

   drawStatistics: function(viewport) {
      var xyz = this.slicePosition,
         dimensions = this.model.getDimensions(),
         spacing = this.model.getSpacing(),
         canvas = this.$('.fg-renderer'),
         ctx = canvas[0].getContext('2d'),
         lineOffset = 2,
         lineHeight = 10,
         lines = [
            "Data Size: [RR]".replace(/RR/g, dimensions.join(', ')),
            "Data Spacing: [RR]".replace(/RR/g, spacing.join(', ')),
            "Probe Field: RR".replace(/RR/g, this.model.getActiveField()),
            "Probe cooridnates: [RR]".replace(/RR/g, this.slicePosition.join(', ')),
            "Probe value: RR".replace(/RR/g, '' + this.lineValues.probe)
         ],
         maxWidth = 0,
         count = lines.length;

      // Draw text information
      ctx.font = lineHeight + "px Verdana";

      while(count--) {
         var lineWidth = ctx.measureText(lines[count]).width;
         maxWidth = (maxWidth < lineWidth) ? lineWidth : maxWidth;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(viewport.area[0], viewport.area[1], maxWidth + 20, lineHeight * (lines.length+2) * 1.2);
      ctx.fillStyle="#000000";
      while(lines.length) {
         ctx.fillText(lines.shift(), viewport.area[0] + 10, viewport.area[1] + (lineOffset++ * lineHeight * 1.2));
      }
   },

   // begin - Method called by the rendering widget
   setLightColor: function() {},
   setLUT: function(fieldName, lutFunction) {},
   forceRedraw: function () {
      this.drawLayout();
   },
   // end - Method called by the rendering widget

   applyLUT: function() {
      var dimensions = this.model.getDimensions(),
         bgCanvas = this.$('.bg-renderer'),
         bgCtx = bgCanvas[0].getContext('2d'),
         pixels = bgCtx.getImageData(0, 0, dimensions[this.bg.xIdx], dimensions[this.bg.yIdx]),
         pixBuffer = pixels.data,
         size = pixBuffer.length,
         idx = 0,
         lutFunction = this.renderingModel.getLookupTableForField(this.model.getActiveField());

      while(idx < size) {
         var value = (pixBuffer[idx] + (256*pixBuffer[idx+1]) + (65536*pixBuffer[idx+2])) / 16777216,
            color = lutFunction(value);

         pixBuffer[idx]   = Math.floor(color[0]);
         pixBuffer[idx+1] = Math.floor(color[1]);
         pixBuffer[idx+2] = Math.floor(color[2]);

         // Move to next pixel
         idx += 4;
      }
      bgCtx.putImageData(pixels, 0, 0);
   }
});


// =========== Control panel ==============

cinema.views.ProbeRendererControlWidget = Backbone.View.extend({
   initialize: function (settings) {
      this.model = settings.model,
      this.controlView = settings.controlView;
   },

   render: function () {
      var model = this.model;
      this.$('.c-control-panel-body').html(cinema.templates.probeRendererControl( {
         fields: this.model.getFields(),
         activeField: this.model.getActiveField(),
         checked: model.getGlobalRangeForChart()
      }));

      this.controlView.setElement(this.$('.fields-control-container')).render();

      // Attach listeners
      this.$('table').off().on('click', function() {
         model.setLayout($(this).attr('layout'));
      });

      this.$('select').off().on('change', function() {
         model.setActiveField($(this).val());
      });

      this.$('input').off().on('change', function() {
         model.setGlobalRangeForChart($(this).is(":checked"));
      });
   }
});
