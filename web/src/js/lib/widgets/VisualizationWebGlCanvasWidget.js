/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 */
cinema.views.VisualizationWebGlCanvasWidget = Backbone.View.extend({
    // Expose primitive events from the canvas for building interactors
    events: {
        'click .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:click', e);
        },
        'dblclick .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:dblclick', e);
        },
        'mousedown .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousedown', e);
        },
        'mousemove .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousemove', e);
        },
        'mouseup .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mouseup', e);
        },
        'mousewheel .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'DOMMouseScroll .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'keypress .c-webglvis-webgl-canvas': function (e) {
            this.trigger('c:keypress', e);
        },
        'contextmenu .c-webglvis-webgl-canvas': function (e) {
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
        this.controlModel = settings.viewpoint.controlModel;
        this.viewpoint = settings.viewpoint;

        if (!this.model.loaded()) {
            this.listenToOnce(this.model, 'change', function () {
                this.initialize(settings);
            });
            return;
        }

        this._privateInit();
        this.compositeModel = settings.model || new cinema.decorators.Composite(this.model);
        this.layers = settings.layers || new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup());
        this.backgroundColor = settings.backgroundColor || '#ffffff';
        this.orderMapping = {};
        this.compositeCache = {};
        this._controls = {};

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
        this.listenTo(this.compositeManager, 'c:data.ready', function (data, controls) {
            if (_.isEqual(controls, this._controls)) {
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
        this.listenTo(this.layers, 'change', this.updateQuery);
        cinema.bindWindowResizeHandler(this, this.drawImage, 200);

        this.xscale = 1.0;
        this.yscale = 1.0;

        this.webglCompositor = settings.webglCompositor;
    },

    render: function () {
        this.$el.html(cinema.templates.webglVisCanvas());

        if (this.$('.c-webglvis-webgl-canvas').length > 0) {
            var imgDim = this.compositeModel.getImageSize();

            var vpDim = [
                this.$('.c-webglvis-webgl-canvas').parent().width(),
                this.$('.c-webglvis-webgl-canvas').parent().height()
            ];

            $(this.$('.c-webglvis-webgl-canvas')[0]).attr({
                width: vpDim[0],
                height: vpDim[1]
            });

            this._resizeViewport(vpDim, imgDim);

            this.webglCompositor.init(imgDim,
                                      this.$('.c-webglvis-webgl-canvas')[0],
                                      this.$('.c-webglvis-composite-buffer')[0]);
        }

        return this;
    },

    _resizeViewport: function (viewportDimensions, imageDimensions) {
        var imgAspect = imageDimensions[0] / imageDimensions[1];
        var vpAspect = viewportDimensions[0] / viewportDimensions[1];

        if (vpAspect > imgAspect) {
            this.naturalZoom = viewportDimensions[1] / imageDimensions[1];
            this.xscale = vpAspect / imgAspect;
            this.yscale = 1.0;
        } else {
            this.naturalZoom = viewportDimensions[0] / imageDimensions[0];
            this.xscale = 1.0;
            this.yscale = imgAspect / vpAspect;
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

    /**
     * Computes the composite image and writes it into the composite buffer.
     * @param data The payload from the composite image manager c:data.ready
     * callback. This will write computed composite data back into that
     * cache entry so it won't have to recompute it.
     */
    _writeCompositeBuffer: function (data) {

        var compositeCanvas = this.$('.c-webglvis-composite-buffer')[0],
            webglCanvas = this.$('.c-webglvis-webgl-canvas')[0],
            dim = this.compositeModel.getImageSize(),
            spritesheetDim = [ data.image.width, data.image.height ],
            compositeCtx = compositeCanvas.getContext('2d'),
            composite = this.compositeCache[data.key];

        $(compositeCanvas).attr({
            width: dim[0],
            height: dim[1]
        });

        this.webglCompositor.clearFbo();

        var idxList = [];
        for (var layerName in this.layerOffset) {
            if (_.has(this.layerOffset, layerName)) {
                idxList.push(this.layerOffset[layerName]);
            }
        }

        var imgw = dim[0], imgh = dim[1];

        for (var i = 0; i < idxList.length; i+=1) {
          //console.log(i);
          var layerIdx = idxList[i];
          var srcX = 0;
          var srcY = layerIdx * imgh;

          // Because the png has transparency, we need to clear the canvas, or else
          // we end up with some blending when we draw the next image
          compositeCtx.clearRect(0, 0, imgw, imgh);
          compositeCtx.drawImage(data.image,
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
        var webglCanvas = this.$('.c-webglvis-webgl-canvas')[0],
            w = this.$el.width(),
            h = this.$el.height();

        if ( w === 0 && h === 0 ) {
            w = 400;
            h = 400;
        }

        $(webglCanvas).attr({
            width: w,
            height: h
        });

        var zoomLevel = this.viewpoint.get('zoom');
        var drawingCenter = this.viewpoint.get('center');
        zoomLevel = zoomLevel / this.naturalZoom;

        //console.log("drawImage, w = " + w + ", h = " + h + ", zoom: " + zoomLevel + ", center: " + drawingCenter);

        this._resizeViewport([w, h], this.compositeModel.getImageSize());
        this.webglCompositor.resizeViewport(w, h);
        this.webglCompositor.drawDisplayPass(this.xscale / zoomLevel, this.yscale / zoomLevel, drawingCenter);

        this.trigger('c:drawn');
    },

    /**
     * Reset the zoom level and drawing center such that the image is
     * centered and zoomed to fit within the parent container.
     */
    resetCamera: function () {
        var w = this.$el.width(),
            h = this.$el.height(),
            iw = this.$('.c-webglvis-composite-buffer').width(),
            ih = this.$('.c-webglvis-composite-buffer').height();

        this.viewpoint.set({
            zoom: Math.min(w / iw, h / ih),
            center: [w / 2, h / 2]
        });
        return this;
    },

    getImage: function () {
        return this.webglCompositor.getImage();
    },

    /**
     * Change the viewpoint to show a different image.
     * @param viewpoint An object containing "time", "phi", and "theta" keys. If you
     * do not pass this, simply renders the current this.viewpoint value.
     * @return this, for chainability
     */
    showViewpoint: function (forced, controlModel) {
        var changed = false,
            controls = controlModel || this.controlModel.getControls();

        // Search for change
        for (var key in controls) {
            if (_.has(this._controls, key)) {
                if (this._controls[key] !== controls[key]) {
                    changed = true;
                }
            } else {
                changed = true;
            }
        }
        this._controls = _.extend(this._controls, controls);
        if (changed || forced) {
            this.compositeManager.downloadData(this._controls);
        } else {
            this.drawImage();
        }
        return this;
    },

    updateQuery: function (query) {
        this.orderMapping = {};
        this.compositeCache = {};
        this._computeLayerOffset();
        this._controls = {}; // force redraw
        this.showViewpoint();
    },

    updateTheQuery: function (query, viewpoint) {
        this.orderMapping = {};
        this.compositeCache = {};
        this.layerOffset = {};

        for (var i = 0; i < query.length; i += 2) {
            var layer = query[i];

            if (query[i + 1] === '_') {
                this.layerOffset[layer] = -1;
            } else {
                this.layerOffset[layer] = this.compositeModel.getSpriteSize() -
                this.compositeModel.getOffset()[query.substr(i, 2)];
            }
        }
        this.showViewpoint(true, viewpoint);
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
