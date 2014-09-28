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
        this.fields = settings.fields;
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
        this._fields = {};

        this.compositeManager = settings.compositeManager ||
            new cinema.utilities.CompositeImageManager({
                visModel: this.model
            });

        this._computeLayerOffset();
        this._first = true;

        this.listenTo(this.compositeManager, 'c:error', function (e) {
            this.trigger('c:error', e);
        });
        this.listenTo(this.compositeManager, 'c:data.ready', function (data, fields) {
            if (_.isEqual(fields, this._fields)) {
                this._writeCompositeBuffer(data);

                if (this._first) {
                    this._first = false;
                    this.resetCamera();
                }
                this.drawImage();
            }
        });
        // this.listenTo(this.fields, 'change', this.drawImage);
        // this.listenTo(this.viewpoint, 'change', this.drawImage);
        this.listenTo(this.layers, 'change', this.updateQuery);

        this.webglCompositor = settings.webglCompositor;
    },

    render: function () {
        this.$el.html(cinema.templates.webglVisCanvas());


        var dim = this.compositeModel.getImageSize();


        $(this.$('.c-webglvis-webgl-canvas')[0]).attr({
            width: this.$('.c-webglvis-webgl-canvas').parent().width(),
            height: this.$('.c-webglvis-webgl-canvas').parent().height()
        });


        this.webglCompositor.init(dim,
                                  this.$('.c-webglvis-webgl-canvas')[0],
                                  this.$('.c-webglvis-spritesheet-buffer')[0],
                                  this.$('.c-webglvis-composite-buffer')[0]);

        return this;
    },

    _computeOffset: function (order) {
        for (var i = 0; i < order.length; i += 1) {
            var offset = this.layerOffset[order[i]];
            if (offset > -1) {
                return offset;
            }
        }
        return -1;
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

    _computeCompositeInfo: function (data) {
        var composite = data.json['pixel-order'].split('+'),
            count = composite.length;
        /*jshint -W016 */
        while (count--) {
            var str = composite[count];
            if (str[0] === '@') {
                composite[count] = Number(str.substr(1));
            } else if (!_.has(this.orderMapping, str)) {
                this.orderMapping[str] = this._computeOffset(str);
            }
        }

        this.compositeCache[data.key] = composite;
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

        var compositeCanvas = this.$('.c-webglvis-composite-buffer')[0],
            spriteCanvas = this.$('.c-webglvis-spritesheet-buffer')[0],
            webglCanvas = this.$('.c-webglvis-webgl-canvas')[0],
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
        /*
        $(webglCanvas).attr({
            width: dim[0],
            height: dim[1]
        });
        */

        // Fill full spritesheet buffer with raw image data
        spriteCtx.clearRect(0, 0, spritesheetDim[0], spritesheetDim[1]);
        spriteCtx.drawImage(data.image, 0, 0);

        this.webglCompositor.clearFbo();

        var idxList = [ 21 ];
        for (var layerName in this.layerOffset) {
            idxList.push(this.layerOffset[layerName]);
        }

        // var idxList = [ 21, 20, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1 ];
        var imgw = dim[0], imgh = dim[1];
        // var idxList = [ 21, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0 ];
        // var idxList = [ 21, 20, 19 ];
        for (var i in idxList) {
          //console.log(i);
          // this.webglCompositor.copySegmentOfSprite(idxList[i]);
          var layerIdx = idxList[i];
          var srcX = 0;
          var srcY = layerIdx * imgh;

          // Because the png has transparency, we need to clear the canvas, or else
          // we end up with some blending when we draw the next image
          compositeCtx.clearRect(0, 0, imgw, imgh);

          compositeCtx.drawImage(spriteCanvas,
                          srcX, srcY, imgw, imgh,
                          0, 0, imgw, imgh);

          this.webglCompositor.drawCompositePass(compositeCanvas);
        }

        //this.webglCompositor.drawDisplayPass();

        //compositeCanvas = this.$('.c-webglvis-composite-buffer')[0],

        // Draw buffer to composite canvas
        //compositeCtx.putImageData(frontBuffer, 0, 0);
        this.trigger('c:composited');
    },

    /**
     * Call this after data has been successfully rendered onto the composite
     * canvas, and it will draw it with the correct scale, zoom, and center
     * onto the render canvas.
     */
    drawImage: function () {
        var zoomLevel = this.viewpoint.get('zoom'),
            drawingCenter = this.viewpoint.get('center');

        console.log("zoom: " + zoomLevel + ", center: " + drawingCenter);

        this.webglCompositor.drawDisplayPass();

        /*
        var renderCanvas = this.$('.c-webglvis-render-canvas')[0],
            compositeCanvas = this.$('.c-webglvis-composite-buffer')[0],
            webglCanvas = this.$('.c-webglvis-webgl-canvas')[0],
            w = this.$el.width(),
            h = this.$el.height(),
            iw = compositeCanvas.width,
            ih = compositeCanvas.height;

        var compositeCtx = compositeCanvas.getContext('2d');
        compositeCtx.clearRect(0, 0, iw, ih);
        compositeCtx.drawImage(webglCanvas.toDataURL("image/png"), 0, 0);

        $(renderCanvas).attr({
            width: w,
            height: h
        });
        renderCanvas.getContext('2d').clearRect(0, 0, w, h);

        var zoomLevel = this.viewpoint.get('zoom'),
            drawingCenter = this.viewpoint.get('center');

        var tw = Math.floor(iw * zoomLevel),
            th = Math.floor(ih * zoomLevel);

        var tx = drawingCenter[0] - (tw / 2),
            ty = drawingCenter[1] - (th / 2);

        renderCanvas.getContext('2d').drawImage(
            compositeCanvas,
            0,   0, iw, ih,  // Source image   [Location,Size]
            tx, ty, tw, th); // Target drawing [Location,Size]

        */
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

    /**
     * Change the viewpoint to show a different image.
     * @param viewpoint An object containing "time", "phi", and "theta" keys. If you
     * do not pass this, simply renders the current this.viewpoint value.
     * @return this, for chainability
     */
    showViewpoint: function (forced) {
        var changed = false,
            fields = this.fields.getFields();

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
        // console.log('new query:');
        // console.log(query.attributes.state);
        this.orderMapping = {};
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
