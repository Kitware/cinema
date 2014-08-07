/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element.
 */
cinema.views.VisualizationCanvasWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.visModel = settings.visModel;
        this.drawingCenter = settings.drawingCenter || [0, 0];
        this.zoomLevel = settings.zoomLevel || 1.0;
        this.compositeManager = new cinema.utilities.CompositeImageManager({
            visModel: this.visModel
        });

        this.compositeManager.on('c:error', function (d) {
            // TODO handle error
        }, this);
    },

    render: function () {
        this.$el.html(cinema.templates.visCanvas());
        window.x = this.visModel;

        this._drawImage();
    },

    _drawImage: function () {
        var renderCanvas = this.$('.c-vis-render-canvas')[0],
            singleCanvas = this.$('.c-vis-single-buffer')[0],
            spriteCanvas = this.$('.c-vis-spritesheet-buffer')[0],
            w = this.$el.width(),
            h = this.$el.height(),
            iw = singleCanvas.width,
            ih = singleCanvas.height;

        if (iw === 0) {
            window.setTimeout(this._drawImage, 100);
        } else {
            $(renderCanvas).attr({
                width: w,
                height: h
            });
            renderCanvas.getContext('2d').clearRect(0, 0, w, h);

            var tw = Math.floor(iw * this.zoomLevel),
            th = Math.floor(ih * this.zoomLevel),
            tx = this.drawingCenter[0] - (tw / 2),
            ty = this.drawingCenter[1] - (th / 2),
            dx = (tw > w) ? (tw - w) : (w - tw),
            dy = (th > h) ? (th - h) : (h - th),
            centerBounds = [(w - dx) / 2, (h - dy) / 2, (w + dx) / 2, (h + dy) / 2];

            if (this.drawingCenter[0] < centerBounds[0] ||
                this.drawingCenter[0] > centerBounds[2] ||
                this.drawingCenter[1] < centerBounds[1] ||
                this.drawingCenter[1] > centerBounds[3]) {
                this.drawingCenter = [
                    Math.min(Math.max(this.drawingCenter[0], centerBounds[0]), centerBounds[2]),
                    Math.min(Math.max(this.drawingCenter[1], centerBounds[1]), centerBounds[3])
                ];
                tx = this.drawingCenter[0] - (tw / 2);
                ty = this.drawingCenter[1] - (th / 2);
            }

            renderCanvas.getContext('2d').drawImage(
                singleCanvas,
                0,   0, iw, ih,  // Source image   [Location,Size]
                tx, ty, tw, th); // Traget drawing [Location,Size]
        }
    }
});
