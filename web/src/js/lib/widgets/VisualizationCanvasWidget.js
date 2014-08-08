/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 */
cinema.views.VisualizationCanvasWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.visModel = settings.visModel;
        this.drawingCenter = settings.drawingCenter || [0, 0];
        this.zoomLevel = settings.zoomLevel || 1.0;
        this.orderMapping = {};
        this.query = "AABBCBDBEBFBGCHCICJCKC"; // TODO figure out what this means
        this.compositeManager = new cinema.utilities.CompositeImageManager({
            visModel: this.visModel
        });

        this.compositeManager.on('c:error', function (e) {
            this.trigger('c:error', e);
        }, this).on('c:data.ready', function (data) {
            this._writeCompositeBuffer(data);
            this.drawImage();
        }, this);
    },

    render: function () {
        this.$el.html(cinema.templates.visCanvas());

        // Fetch and render the initial phi/time/theta image.
        var args = this.visModel.get('arguments');
        this.compositeManager.updateFields(
            args.time['default'], args.phi['default'], args.theta['default']);
    },

    /**
     * Computes the composite image and writes it into the composite buffer.
     * @param data The payload from the composite image manager c:data.ready
     * callback. This will write computed composite data back into that
     * cache entry so it won't have to recompute it.
     */
    _writeCompositeBuffer: function (data) {
        if (!_.has(data, 'composite')) {
            cinema.utilities.computeCompositeData(data, this.orderMapping);
        }

        var renderCanvas = this.$('.c-vis-render-canvas')[0],
            compositeCanvas = this.$('.c-vis-composite-buffer')[0],
            spriteCanvas = this.$('.c-vis-spritesheet-buffer')[0],
            composite = data.composite,
            fullPixelOffset = singleImageSize[0] * singleImageSize[1] * 4,
            count = composite.length;

        // Fill buffer with image
        bgCTX.drawImage(data.image, 0, 0);

        var pixelBuffer = bgCTX.getImageData(0, 0, fullImageSize[0], fullImageSize[1]).data,
        frontBuffer = null, frontPixels = null, pixelIdx = 0, localIdx;

        // Fill with bg color
        if(bgColor) {
            frontCTX.fillStyle = bgColor;
            frontCTX.fillRect(0,0,singleImageSize[0], singleImageSize[1]);
            frontBuffer = frontCTX.getImageData(0, 0, singleImageSize[0], singleImageSize[1]);
            frontPixels = frontBuffer.data;
        } else {
            frontBuffer = bgCTX.getImageData(0, (nbImages - 1) * singleImageSize[1], singleImageSize[0], singleImageSize[1]);
            frontPixels = frontBuffer.data;
        }

        for (var i = 0; i < count; i += 1) {
            var order = composite[i];
            if(order > 0) {
                pixelIdx += order;
            } else {
                var offset = this.orderMapping[order];

                if(offset > -1) {
                    localIdx = 4 * pixelIdx;
                    offset *= fullPixelOffset;
                    offset += localIdx;
                    frontPixels[localIdx] = pixelBuffer[offset];
                    frontPixels[localIdx + 1] = pixelBuffer[offset + 1];
                    frontPixels[localIdx + 2] = pixelBuffer[offset + 2];
                    frontPixels[localIdx + 3] = 255;
                }
                // Move forward
                pixelIdx += 1;
            }
        }

        // Draw buffer to canvas
        frontCTX.putImageData(frontBuffer, 0, 0);
        container.trigger('render-bg');
    },

    /**
     * Call this after data has been successfully rendered onto the composite
     * canvas, and it will draw it with the correct scale, zoom, and center
     * onto the render canvas.
     */
    drawImage: function () {
        var renderCanvas = this.$('.c-vis-render-canvas')[0],
            compositeCanvas = this.$('.c-vis-composite-buffer')[0],
            w = this.$el.width(),
            h = this.$el.height(),
            iw = compositeCanvas.width,
            ih = compositeCanvas.height;

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
            compositeCanvas,
            0,   0, iw, ih,  // Source image   [Location,Size]
            tx, ty, tw, th); // Traget drawing [Location,Size]
    }
});
