/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 */
cinema.views.VisualizationWebGlLutCanvasWidget = Backbone.View.extend({
    // Expose primitive events from the canvas for building interactors
    events: {
        'click .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:click', e);
        },
        'dblclick .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:dblclick', e);
        },
        'mousedown .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:mousedown', e);
        },
        'mousemove .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:mousemove', e);
        },
        'mouseup .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:mouseup', e);
        },
        'mousewheel .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'DOMMouseScroll .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'keypress .c-webgllut-webgl-canvas': function (e) {
            this.trigger('c:keypress', e);
        },
        'contextmenu .c-webgllut-webgl-canvas': function (e) {
            e.preventDefault();
        }
    },

    //subclass uses to extend
    _privateInit: function (settings) {

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
        this.compositeModel = new cinema.decorators.Composite(this.model);
        this.layers = settings.layers || new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup());
        this.backgroundColor = settings.backgroundColor || '#ffffff';
        this.orderMapping = {};
        this.compositeCache = {};
        this._controls = {};
        this.renderingModel = settings.renderingModel;

        this.lutArrayBuffers = {};
        this.lutArrayViews = {};
        var fieldsList = this.renderingModel.getFields();

        var self = this;
        _.each(fieldsList, function(fieldName) {
            self.lutArrayBuffers[fieldName] = new ArrayBuffer(256*1*4);
            self.lutArrayViews[fieldName] = new Uint8Array(self.lutArrayBuffers[fieldName]);
        });

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

                cinema.events.trigger('c:fpsupdate', {'curFps': curFps, 'avgFps': avgFps});
            }
        });
        this.listenTo(this.layers, 'change', this.updateQuery);
        this.listenTo(this.renderingModel, 'c:lut-invalid', this.updateLut);
        cinema.bindWindowResizeHandler(this, this.drawImage, 200);

        this.xscale = 1.0;
        this.yscale = 1.0;

        this.webglCompositor = settings.webglCompositor;

        // Generate map of where to find needed sprite offets for each layer
        this._fieldNameMap = {};
        this._lightingFields = [ 'nX', 'nY', 'nZ' ];

        var fieldJson = this.model.attributes.metadata.fields;
        for (var fCode in fieldJson) {
            if (_.has(fieldJson, fCode)) {
                this._fieldNameMap[fieldJson[fCode]] = fCode;
            }
        }

        this._maxOffset = this._calculateMaxOffset();
    },

    render: function () {
        this.$el.html(cinema.templates.webglLutVisCanvas());

        if (this.$('.c-webgllut-webgl-canvas').length > 0) {
            var imgDim = this.compositeModel.getImageSize();

            var vpDim = [
                this.$('.c-webgllut-webgl-canvas').parent().width(),
                this.$('.c-webgllut-webgl-canvas').parent().height()
            ];

            $(this.$('.c-webgllut-webgl-canvas')[0]).attr({
                width: vpDim[0],
                height: vpDim[1]
            });

            this._resizeViewport(vpDim, imgDim);

            this.webglCompositor.init(imgDim,
                                      this.$('.c-webgllut-webgl-canvas')[0]);
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

    _calculateMaxOffset: function() {
        var offsetMap = this.model.attributes.metadata.offset;
        var maxOffset = 0;
        for (var offKey in offsetMap) {
            if (_.has(offsetMap, offKey)) {
                maxOffset += 1;
            }
        }
        return maxOffset;
    },

    updateLut: function(event) {
        var lut = this.renderingModel.getLookupTableForField(event.field);
        this.setLUT(event.field, lut);
    },

    setLUT: function (fieldName, _lut) {
        if (!_.has(this.lutArrayBuffers, fieldName)) {
            this.lutArrayBuffers[fieldName] = new ArrayBuffer(256*1*4);
            this.lutArrayViews[fieldName] = new Uint8Array(this.lutArrayBuffers[fieldName]);
        }
        for (var i = 0; i < 256; i+=1) {
            var idx = i * 4;
            var val = i / 255;
            var color = _lut(val);
            // console.log("val:", val, "color:", color);
            this.lutArrayViews[fieldName][idx] = Math.round(color[0]);
            this.lutArrayViews[fieldName][idx + 1] = Math.round(color[1]);
            this.lutArrayViews[fieldName][idx + 2] = Math.round(color[2]);
            this.lutArrayViews[fieldName][idx + 3] = 1.0;
        }
    },

    setLightTerms: function (terms) {},

    /**
     * Computes the composite image and writes it into the composite buffer.
     * @param data The payload from the composite image manager c:data.ready
     * callback. This will write computed composite data back into that
     * cache entry so it won't have to recompute it.
     */
    _writeCompositeBuffer: function (data) {

        if (!this.renderingModel.loaded()) {
            console.log("Not ready to render yet.");
            return;
        }

        var compositeCanvas = this.$('.c-webgllut-composite-buffer')[0],
            webglCanvas = this.$('.c-webgllut-webgl-canvas')[0],
            scalarCanvas = this.$('.c-webgllut-scalar-buffer')[0],
            dim = this.compositeModel.getImageSize(),
            spritesheetDim = [ data.image.width, data.image.height ],
            compositeCtx = compositeCanvas.getContext('2d'),
            scalarCtx = scalarCanvas.getContext('2d'),
            composite = this.compositeCache[data.key];

        $(compositeCanvas).attr( { width: dim[0],            height: dim[1] });
        $(scalarCanvas).attr(    { width: dim[0],            height: dim[1] });

        var idxList = [];
        for (var layerName in this.layerOffset) {
            if (_.has(this.layerOffset, layerName)) {
                // Figure out if this is a "lutable" layer, i.e. do we color it with a LUT?
                var lutableLayer = true;
                var layerField = this.layers.attributes.state[layerName]; // this.layerOffset[layerName];
                var fieldDependencies = this.model.attributes.metadata.color_by_dependencies[layerField];
                var lutOffsets = {};

                if (fieldDependencies && _.has(fieldDependencies, 'lutfield') && fieldDependencies.lutfield === "true") {
                    lutOffsets.scalar = this.layerOffset[layerName];
                    lutOffsets.colorBy = this.compositeModel.getFieldName(this.layers.attributes.state[layerName]);
                    idxList.push(lutOffsets);
                } else {
                    idxList.push(this.layerOffset[layerName]);
                }
            }
        }

        // Clear the fbo for a new round of compositing
        this.webglCompositor.clearFbo();

        var imgw = dim[0], imgh = dim[1];

        // Draw a background pass
        var bgColor = [ 1.0, 1.0, 1.0 ];
        // var bgColor = [ 0.0, 0.0, 0.0 ];
        compositeCtx.clearRect(0, 0, imgw, imgh);
        compositeCtx.drawImage(data.image, 0, (this._maxOffset * imgh), imgw, imgh, 0, 0, imgw, imgh);
        this.webglCompositor.drawBackgroundPass(compositeCanvas, bgColor);

        var srcX = 0, srcY = 0;

        for (var i = 0; i < idxList.length; i+=1) {
            if (typeof(idxList[i]) === 'number') {   // layer is not colored with a LUT, just use image color
                //console.log(i);
                var layerIdx = idxList[i];
                srcX = 0;
                srcY = layerIdx * imgh;

                // Because the png has transparency, we need to clear the canvas, or else
                // we end up with some blending when we draw the next image
                compositeCtx.clearRect(0, 0, imgw, imgh);
                compositeCtx.drawImage(data.image, srcX, srcY, imgw, imgh, 0, 0, imgw, imgh);

                this.webglCompositor.drawCompositePass(compositeCanvas);
            } else {                                // layer is colored with a LUT
                var lOffMap = idxList[i];
                srcX = 0;
                srcY = 0;

                // Copy the scalar buffer
                srcY = lOffMap.scalar * imgh;
                scalarCtx.clearRect(0, 0, imgw, imgh);
                scalarCtx.drawImage(data.image, srcX, srcY, imgw, imgh, 0, 0, imgw, imgh);

                this.webglCompositor.drawLutCompositePass(scalarCanvas, this.lutArrayViews[lOffMap.colorBy]);
            }
        }

        this.trigger('c:composited');
    },

    /**
     * Call this after data has been successfully rendered onto the composite
     * canvas, and it will draw it with the correct scale, zoom, and center
     * onto the render canvas.
     */
    drawImage: function () {
        var webglCanvas = this.$('.c-webgllut-webgl-canvas')[0],
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

        // console.log("zoom: " + zoomLevel + ", center: " + drawingCenter);

        var zoomLevel = this.viewpoint.get('zoom');
        var drawingCenter = this.viewpoint.get('center');
        zoomLevel = zoomLevel / this.naturalZoom;

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
            iw = this.$('.c-webgllut-composite-buffer').width(),
            ih = this.$('.c-webgllut-composite-buffer').height();

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

    forceRedraw: function () {
        this.showViewpoint(true);
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
