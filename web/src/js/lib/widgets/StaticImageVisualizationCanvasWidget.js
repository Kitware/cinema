/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 * This implementation assume static image.
 */
cinema.views.StaticImageVisualizationCanvasWidget = Backbone.View.extend({
    // Expose primitive events from the canvas for building interactors
    events: {
        'click .c-vis-render-canvas': function (e) {
            this.trigger('c:click', e);
        },
        'dblclick .c-vis-render-canvas': function (e) {
            this.trigger('c:dblclick', e);
        },
        'mousedown .c-vis-render-canvas': function (e) {
            this.trigger('c:mousedown', e);
        },
        'mousemove .c-vis-render-canvas': function (e) {
            this.trigger('c:mousemove', e);
        },
        'mouseup .c-vis-render-canvas': function (e) {
            this.trigger('c:mouseup', e);
        },
        'mousewheel .c-vis-render-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'DOMMouseScroll .c-vis-render-canvas': function (e) {
            this.trigger('c:mousewheel', e);
        },
        'keypress .c-vis-render-canvas': function (e) {
            this.trigger('c:keypress', e);
        },
        'contextmenu .c-vis-render-canvas': function (e) {
            e.preventDefault();
        }
    },

    //subclass uses to extend
    _privateInit: function () {
    },

    initialize: function (settings) {
        this.model = settings.model;
        this.controlModel = settings.controlModel;
        this.viewpoint = settings.viewpoint;

        if (!this.model.loaded()) {
            this.listenToOnce(this.model, 'change', function () {
                this.initialize(settings);
            });
            return;
        }

        this.imageManager = settings.imageManager || this.model.imageManager ||
            new cinema.utilities.ImageManager({
                visModel: this.model
            });

        this._privateInit();
        this._controls = {};
        this._first = true;
        this.listenTo(this.imageManager, 'c:data.ready', function () {
            if (this._first) {
                this._first = false;
                this.resetCamera();
            }
            this.drawImage();
        });
        cinema.bindWindowResizeHandler(this, this.resizeEvent, 200);

        this.showViewpoint();
    },

    render: function () {
        this.$el.html(cinema.templates.staticCanvas());
        return this;
    },

    resizeEvent: function() {
        this.resetCamera();
    },

    /**
     * Call this after data has been successfully rendered onto the composite
     * canvas, and it will draw it with the correct scale, zoom, and center
     * onto the render canvas.
     */
    drawImage: function () {
        var canvas = this.$('.c-vis-render-canvas'),
            renderCanvas = canvas[0],
            imageToDraw = this.imageManager.getImage(),
            w = this.$el.parent().width(),
            h = this.$el.parent().height(),
            iw = imageToDraw ? imageToDraw.width : 500,
            ih = imageToDraw ? imageToDraw.height : 500,
            ctx = renderCanvas ? renderCanvas.getContext('2d') : null;

        if (imageToDraw === null || ctx === null) {
            return;
        }

        canvas.attr({
            width: w,
            height: h
        });
        ctx.clearRect(0, 0, w, h);

        var zoomLevel = this.viewpoint.get('zoom'),
            drawingCenter = this.viewpoint.get('center');

        var tw = Math.floor(iw * zoomLevel),
            th = Math.floor(ih * zoomLevel);

        var tx = drawingCenter[0] - (tw / 2),
            ty = drawingCenter[1] - (th / 2);

        try {
            ctx.drawImage(
                imageToDraw,
                0,   0, iw, ih,  // Source image   [Location,Size]
                tx, ty, tw, th); // Target drawing [Location,Size]
        } catch (err) {
        }
    },

    /**
     * Reset the zoom level and drawing center such that the image is
     * centered and zoomed to fit within the parent container.
     */
    resetCamera: function () {
        var w = this.$el.parent().width(),
            h = this.$el.parent().height(),
            imageToDraw = this.imageManager.getImage(),
            iw = imageToDraw ? imageToDraw.width : 500,
            ih = imageToDraw ? imageToDraw.height : 500;

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
    showViewpoint: function () {
        var changed = false,
            controls = this.controlModel.getControls();

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

        if (changed) {
            this.imageManager.updateControls(this._controls);
        } else {
            this.drawImage();
        }
        return this;
    }
});
