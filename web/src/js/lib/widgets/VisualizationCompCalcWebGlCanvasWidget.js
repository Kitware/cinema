/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 */
cinema.views.VisualizationCompCalcWebGlCanvasWidget = Backbone.View.extend({
    // Expose primitive events from the canvas for building interactors
    events: {
        'click .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:click', e);
        },
        'dblclick .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:dblclick', e);
        },
        'mousedown .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousedown', e);
        },
        'mousemove .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousemove', e);
        },
        'mouseup .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mouseup', e);
        },
        'mousewheel .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'DOMMouseScroll .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'keypress .c-compcalc-webglvis-webgl-canvas': function (e) {
            this.trigger('c:keypress', e);
        },
        'contextmenu .c-compcalc-webglvis-webgl-canvas': function (e) {
            e.preventDefault();
        }
    },

    //subclass uses to extend
    _privateInit: function () {
    },

    /**
     * This widget should be initialized with a visModel as the model parameter
     * and optionally a pre-existing CompositeImageManager.
     *
     * @param model The VisualizationModel being rendered.
     * @param [layers] A LayerModel to use. If none is passed, creates one
     *        internally.
     * @param [compositeManager] A CompositeImageManager to use. If none is
     *        passed, uses the one that is set as the imageManager property of
     *        the visModel. If that is not set, creates one internally.
     */
    initialize: function (settings) {
        this.controls = settings.controls;
        this.viewpoint = settings.viewpoint;

        if (!this.model.loaded()) {
            this.listenToOnce(this.model, 'change', function () {
                this.initialize(settings);
            });
            return;
        }

        this._privateInit();
        this.compositeModel = new cinema.decorators.Composite(this.model);
        this.layers = settings.layers || new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup());
        this.backgroundColor = settings.backgroundColor || '#ffffff';
        //this.orderMapping = {};
        this.compositeCache = {};
        this._fields = {};

        this.compositeManager = settings.compositeManager ||
            new cinema.utilities.CompositeImageManager({
                visModel: this.model
            });

        this._computeLayerOffset();
        this._first = true;

        this.avgElapsedMillis = 0.0;
        this.totalElapsedMillis = 0.0;
        this.compositeCount = 0;

        this.listenTo(this.compositeManager, 'c:error', function (e) {
            this.trigger('c:error', e);
        });
        this.listenTo(this.compositeManager, 'c:data.ready', function (data, fields) {
            if (_.isEqual(fields, this._fields)) {
                var startMillis = Date.now();

                this._writeCompositeBuffer(data);
                if (this._first) {
                    this._first = false;
                    this.resetCamera();
                }
                this.drawImage();

                var elapsedMillis = Date.now() - startMillis;
                this.compositeCount += 1;
                this.totalElapsedMillis += elapsedMillis;
                this.averageElapsedMillis = this.totalElapsedMillis / this.compositeCount;

                var curFps = Math.floor((1.0 / elapsedMillis) * 1000);
                var avgFps = Math.floor((1.0 / this.averageElapsedMillis) * 1000);
                this.$('.s-timing-info-current').text(curFps);
                this.$('.s-timing-info-average').text(avgFps);
            }
        });
        this.listenTo(this.controls, 'change', this.drawImage);
        this.listenTo(this.viewpoint, 'change', this.drawImage);
        this.listenTo(this.layers, 'change', this.updateQuery);

        this.xscale = 1.0;
        this.yscale = 1.0;

        this.webglCompositor = settings.webglCompositor;
    },

    render: function () {
        this.$el.html(cinema.templates.compCalcWebglVisCanvas());

        if (this.$('.c-compcalc-webglvis-webgl-canvas').length > 0) {
            var imgDim = this.compositeModel.getImageSize();

            var vpDim = [
                this.$('.c-compcalc-webglvis-webgl-canvas').parent().width(),
                this.$('.c-compcalc-webglvis-webgl-canvas').parent().height()
            ];

            $(this.$('.c-compcalc-webglvis-webgl-canvas')[0]).attr({
                width: vpDim[0],
                height: vpDim[1]
            });

            this._resizeViewport(vpDim, imgDim);

            this.webglCompositor.init(imgDim,
                                      this.$('.c-compcalc-webglvis-webgl-canvas')[0],
                                      this.$('.c-compcalc-webglvis-composite-buffer')[0]);
        }

        return this;
    },

    _resizeViewport: function (viewportDimensions, imageDimensions) {
        var imgAspect = imageDimensions[0] / imageDimensions[1];
        var vpAspect = viewportDimensions[0] / viewportDimensions[1];

        if (vpAspect > imgAspect) {
            this.xscale = vpAspect;
            this.yscale = 1.0;
        } else {
            this.xscale = 1.0;
            this.yscale = 1.0 / vpAspect;
        }
    },

    _computeLayerOffset: function () {
        var query;

        this.layerOffset = {};

        query = this.layers.serialize();
        for (var i = 0; i < query.length; i += 2) {
            var layer = query[i];

            if (query[i + 1] === '_') {
                this.layerOffset[layer] = -1;
            } else {
                this.layerOffset[layer] = this.compositeModel.getSpriteSize() -
                    this.compositeModel.getOffset()[query.substr(i, 2)];
            }
        }
    },

    _calculateCorrectOffsets: function() {
        // this.model.attributes.metadata.offset

        var maxOffset = 0;
        var spriteImageCount = 1;              // always have one background?
        var layerMap = {};
        var correctOffsets = {};

        var offsets = this.model.attributes.metadata.offset;

        // First iterate over the offset map to find the number of layers and
        // keep track of the maximum offset
        for (var key in offsets) {
            if (_.has(offsets, key)) {
                spriteImageCount += 1;
                layerMap[key[0]] = [];
                if (offsets[key] > maxOffset) {
                    maxOffset = offsets[key];
                }
            }
        }

        // Now go through the offset map again, updating the offsets (they are
        // reversed in the info.json from their true position in the sprite).
        // We also want a quick way to know the sprite offsets for every layer.
        for (key in offsets) {
            if (_.has(offsets, key)) {
                var newOffset = maxOffset - offsets[key];
                correctOffsets[key] = newOffset;
                layerMap[key[0]].push(newOffset);
            }
        }

        layerMap['+'] = [ maxOffset ];

        return {
            'maxOffset': maxOffset,
            'spriteImageCount': spriteImageCount,
            'layerMap': layerMap,
            'correctOffsets': correctOffsets
        };
    },

    _computeCompositeInfo: function (data) {
        var spriteLayerInfo = this._calculateCorrectOffsets();

        var pixels = data.json['pixel-order'].split('+');
        var compositeArray = [];
        for (var pixelIdx = 0; pixelIdx < pixels.length - 1; pixelIdx += 1) {
            var pixel = pixels[pixelIdx];
            if (pixel.length > 0 && pixel[0] === '@') {
                compositeArray.push(pixel.substring(1));
            } else {
                compositeArray.push(pixel);
            }
        }

        this.compositeCache[data.key] = {
            'spriteLayerInfo': spriteLayerInfo,
            'compositeArray': compositeArray
        };
    },

    /**
     * Computes the composite image and writes it into the composite buffer.
     * @param data The payload from the composite image manager c:data.ready
     * callback. This will write computed composite data back into that
     * cache entry so it won't have to recompute it.
     */
    _writeCompositeBuffer: function (data) {
        if (!_.has(this.compositeCache, data.key)) {
            this._computeCompositeInfo(data);
        }

        var compositeCanvas = this.$('.c-compcalc-webglvis-composite-buffer')[0],
            spriteCanvas = this.$('.c-compcalc-webglvis-spritesheet-buffer')[0],
            webglCanvas = this.$('.c-compcalc-webglvis-webgl-canvas')[0],
            dim = this.compositeModel.getImageSize(),
            spritesheetDim = [ data.image.width, data.image.height ],
            spriteCtx = spriteCanvas.getContext('2d'),
            compositeCtx = compositeCanvas.getContext('2d'),
            composite = this.compositeCache[data.key];

        $(spriteCanvas).attr({
            width: spritesheetDim[0],
            height: spritesheetDim[1]
        });
        $(compositeCanvas).attr({
            width: dim[0],
            height: dim[1]
        });

        var compositeData = this.compositeCache[data.key];
        var compositeArray = compositeData.compositeArray;
        var layerMap = compositeData.spriteLayerInfo.layerMap;
        var maxOffset = compositeData.spriteLayerInfo.maxOffset;

        // Fill full spritesheet buffer with raw image data
        spriteCtx.clearRect(0, 0, spritesheetDim[0], spritesheetDim[1]);
        spriteCtx.drawImage(data.image, 0, 0);             // All pixels are now fully opaque

        var spriteImgData = spriteCtx.getImageData(0, 0, spritesheetDim[0], spritesheetDim[1]);
        var pixelBuffer = spriteImgData.data;
        var pixelBufferIdx = 0;
        var pixelIdx = 0;

        // This image data will be same size as sprite, initialized to all black + transparent
        var newImgData = spriteCtx.createImageData(spriteImgData);
        var newPixelBuf = newImgData.data;

        // Now go through the composite array data and write the correct depth
        // in to the alpha channel.
        for (var caIdx = 0; caIdx < compositeArray.length; caIdx += 1) {
            var pixelStack = compositeArray[caIdx];
            var count = 1;
            var layers = '+';

            if (pixelStack !== '' && !isNaN(pixelStack)) {
                // layers is already good, all of these are background
                count = parseInt(pixelStack);
            } else {
                // count is already good, it's just a single pixel
                layers = pixelStack + '+';
            }

            for (var i = 0; i < count; i += 1) {
                var x = pixelIdx % dim[0];
                var y = Math.floor(pixelIdx / dim[0]);

                var depthValue = 0;
                for (var j = 0; j < layers.length; j += 1) {
                    var layerCode = layers[j];
                    var layerIndices = layerMap[layerCode];
                    for (var k = 0; k < layerIndices.length; k += 1) {
                        var layerIdx = layerIndices[k];
                        var yOffset = layerIdx * dim[1];
                        pixelBufferIdx = (((y+yOffset) * dim[0]) + x) * 4;

                        newPixelBuf[pixelBufferIdx] = pixelBuffer[pixelBufferIdx];
                        newPixelBuf[pixelBufferIdx + 1] = pixelBuffer[pixelBufferIdx + 1];
                        newPixelBuf[pixelBufferIdx + 2] = pixelBuffer[pixelBufferIdx + 2];
                        newPixelBuf[pixelBufferIdx + 3] = (255 - (depthValue * 20));
                    }
                    depthValue += 1;
                }
                pixelIdx += 1;
            }
        }

        // Now put the alpha-corrected (depth-corrected) image into the sprite canvas
        spriteCtx.putImageData(newImgData, 0, 0);

        // Now clear out the copy canvas to prepare for compositing loop
        this.webglCompositor.clearFbo();

        var idxList = [ maxOffset ];
        // var idxList = [];
        for (var layerName in this.layerOffset) {
            if (_.has(this.layerOffset, layerName)) {
                idxList.push(this.layerOffset[layerName]);
            }
        }

        var imgw = dim[0], imgh = dim[1];

        for (var lidx = 0; lidx < idxList.length; lidx+=1) {
          var layerIndex = idxList[lidx];
          var srcX = 0;
          var srcY = layerIndex * imgh;

          // Because the png has transparency, we need to clear the canvas, or else
          // we end up with some blending when we draw the next image
          compositeCtx.clearRect(0, 0, imgw, imgh);

          compositeCtx.drawImage(spriteCanvas,
                          srcX, srcY, imgw, imgh,
                          0, 0, imgw, imgh);

          this.webglCompositor.drawCompositePass(compositeCanvas);
        }

        this.trigger('c:composited');
    },

    /**
     * Call this after data has been successfully rendered onto the composite
     * canvas, and it will draw it with the correct scale, zoom, and center
     * onto the render canvas.
     */
    drawImage: function () {
        var webglCanvas = this.$('.c-compcalc-webglvis-webgl-canvas')[0],
            w = this.$el.width(),
            h = this.$el.height();

        $(webglCanvas).attr({
            width: w,
            height: h
        });

        // console.log("zoom: " + zoomLevel + ", center: " + drawingCenter);

        var zoomLevel = this.viewpoint.get('zoom');
        var drawingCenter = this.viewpoint.get('center');

        this._resizeViewport([w, h], this.compositeModel.getImageSize());
        this.webglCompositor.resizeViewport(w, h);
        this.webglCompositor.drawDisplayPass(this.xscale / zoomLevel * 2.0, this.yscale / zoomLevel * 2.0, drawingCenter);

        this.trigger('c:drawn');
    },

    /**
     * Reset the zoom level and drawing center such that the image is
     * centered and zoomed to fit within the parent container.
     */
    resetCamera: function () {
        var w = this.$el.width(),
            h = this.$el.height(),
            iw = this.$('.c-compcalc-webglvis-composite-buffer').width(),
            ih = this.$('.c-compcalc-webglvis-composite-buffer').height();

        this.viewpoint.set({
            zoom: Math.min(w / iw, h / ih),
            center: [w / 2, h / 2]
        });
        return this;
    },

    /**
     * Change the viewpoint to show a different image.
     * @param viewpoint An object containing "time", "phi", and "theta" keys. If you
     * do not pass this, simply renders the current this.viewpoint value.
     * @return this, for chainability
     */
    showViewpoint: function (forced) {
        var changed = false,
            fields = this.controls.getControls();

        // Search for change
        for (var key in fields) {
            if (_.has(this._fields, key)) {
                if (this._fields[key] !== fields[key]) {
                    changed = true;
                }
            } else {
                changed = true;
            }
        }
        this._fields = _.extend(this._fields, fields);
        if (changed || forced) {
            this.compositeManager.downloadData(this._fields);
        } else {
            this.drawImage();
        }
        return this;
    },

    updateQuery: function (query) {
        //this.orderMapping = {};
        this.compositeCache = {};
        this._computeLayerOffset();
        this._fields = {}; // force redraw
        this.showViewpoint();
    },

    /**
     * Maps an [x, y] value relative to the canvas element to an [x, y] value
     * relative to the image being rendered on the canvas.
     * @param coords 2-length list representing [x, y] offset into the canvas
     * element.
     * @returns the corresponding [x, y] value of the image being rendered on
     * the canvas, respecting zoom level and drawing center, or null if the
     * input coordinates are on a part of the canvas outside of the image render
     * bounds. If not null, this will be a value bounded in each dimension by
     * the length of the composited image in that dimension.
     */
    mapToImageCoordinates: function (coords) {
        // TODO
    }
});
