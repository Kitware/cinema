cinema.views.LookupTableWidget = Backbone.View.extend({
    events: {
        'change .c-lookuptable-x': 'updateControlPoint',
        'click .c-swatch-color': 'updateColor',
        'change select' : 'updateViewPort',
        'click .c-light-color': 'updateLightColor',
        'change input': 'updateLighting',
        'mousemove .c-lookuptable-canvas': 'mouseMove',
        'mousedown .c-lookuptable-canvas': 'mouseDown',
        'mouseup .c-lookuptable-canvas': 'mouseUp',
        'dblclick .c-lookuptable-canvas': 'mouseDoubleClick'
    },

    mouseMove: function (e) {
        if (this.editLookupTable) {
            if (this.mousePressed) {
                var mousePosition = this.getMouseX(this.lookuptableCanvas, e);
                if (this.selectedControlPoint !== 0 && this.selectedControlPoint !== (this.controlPoints.length - 1)) {
                    if ((mousePosition.x < this.controlPoints[this.selectedControlPoint + 1].x) &&
                        (mousePosition.x > this.controlPoints[this.selectedControlPoint - 1].x)) {
                        this.controlPoints[this.selectedControlPoint].x = mousePosition.x;
                        this.drawLookupTable();
                        this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                    }
                }
            }
        }
    },

    mouseDown: function (e) {
        if (this.editLookupTable) {
            this.mousePressed = true;
            var mousePosition = this.getMouseX(this.lookuptableCanvas, e);
            this.findControlPoint(this.lookuptableCanvas, mousePosition.x);
            if (this.selectedControlPoint !== -1) {
                var color = [ this.controlPoints[this.selectedControlPoint].r,
                    this.controlPoints[this.selectedControlPoint].g,
                    this.controlPoints[this.selectedControlPoint].b ];
                this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
                this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
            }
            this.drawLookupTable();
        }
    },

    mouseUp: function (e) {
        if (this.editLookupTable) {
            this.mousePressed = false;
            var mousePosition = this.getMouseX(this.lookuptableCanvas, e);
        }
    },

    mouseDoubleClick: function (e) {
        if (this.editLookupTable) {
            var color = [];
            this.mousePressed = false;
            var mousePosition = this.getMouseX(this.lookuptableCanvas, e),
                frontItem = this.findFrontItem(mousePosition.x);
            this.findControlPoint(this.lookuptableCanvas, mousePosition.x);
            if (this.selectedControlPoint === -1) {
                this.controlPoints.splice(frontItem, 0,
                    {
                        x: mousePosition.x,
                        r: this.interpolate(mousePosition.x, frontItem - 1, 'r'),
                        g: this.interpolate(mousePosition.x, frontItem - 1, 'g'),
                        b: this.interpolate(mousePosition.x, frontItem - 1, 'b')
                    }
                );
                this.selectedControlPoint = frontItem;
                color = [ this.controlPoints[this.selectedControlPoint].r,
                    this.controlPoints[this.selectedControlPoint].g,
                    this.controlPoints[this.selectedControlPoint].b ];
                this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
                this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                this.drawLookupTable();
            }
            else {
                if (this.selectedControlPoint !== 0 && this.selectedControlPoint !== (this.controlPoints.length - 1)) {
                    color = [ this.controlPoints[this.selectedControlPoint].r,
                        this.controlPoints[this.selectedControlPoint].g,
                        this.controlPoints[this.selectedControlPoint].b ];
                    this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
                    this.controlPoints.splice(this.selectedControlPoint, 1);
                    this.selectedControlPoint = -1;
                    this.drawLookupTable();
                }
            }
        }
    },

    registerLUT: function (name, func) {
        this.lutKeys.push(name);
        this.lutMap[name] = func;
    },

    initialize: function (settings) {
        if (!settings.viewport) {
            throw "Lookup table widget requires a viewport.";
        }
        this.fields = settings.viewport.fields;
        this.viewpoint = settings.viewport.viewpoint;
        this.viewport = settings.viewport;
        this.editLookupTable = true;
        this.xMinimum = -19657.00;
        this.xMaximum = 5678.29;
        this.clampMinimum = this.xMinimum;
        this.clampMaximum = this.xMaximum;
        this.clampMidpoint = this.mapToClampedRange(0.5);

        this.toolbarRendering = new cinema.views.RenderingControlToolbar({el: settings.toolbarContainer});

        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.fields, 'change', this._refresh);
        this.listenTo(cinema.events, 'c:editlookuptable', this.hideLookupTableEditor);
        this.listenTo(cinema.events, 'c:editlighting', this.hideLightingEditor);

        this.lutMap = {};
        this.lutKeys = [];
        this.swatchColors = [
            {r: 255, g: 255, b: 255}, {r: 204, g: 255, b: 255}, {r: 204, g: 204, b: 255}, {r: 204, g: 204, b: 255},
            {r: 204, g: 204, b: 255}, {r: 204, g: 204, b: 255}, {r: 204, g: 204, b: 255}, {r: 204, g: 204, b: 255},
            {r: 204, g: 204, b: 255}, {r: 204, g: 204, b: 255}, {r: 204, g: 204, b: 255}, {r: 255, g: 204, b: 255},
            {r: 255, g: 204, b: 204}, {r: 255, g: 204, b: 204}, {r: 255, g: 204, b: 204}, {r: 255, g: 204, b: 204},
            {r: 255, g: 204, b: 204}, {r: 255, g: 204, b: 204}, {r: 255, g: 204, b: 204}, {r: 255, g: 204, b: 204},
            {r: 255, g: 204, b: 204}, {r: 255, g: 255, b: 204}, {r: 204, g: 255, b: 204}, {r: 204, g: 255, b: 204},
            {r: 204, g: 255, b: 204}, {r: 204, g: 255, b: 204}, {r: 204, g: 255, b: 204}, {r: 204, g: 255, b: 204},
            {r: 204, g: 255, b: 204}, {r: 204, g: 255, b: 204}, {r: 204, g: 255, b: 204}, {r: 204, g: 204, b: 204},
            {r: 153, g: 255, b: 255}, {r: 153, g: 204, b: 255}, {r: 153, g: 153, b: 255}, {r: 153, g: 153, b: 255},
            {r: 153, g: 153, b: 255}, {r: 153, g: 153, b: 255}, {r: 153, g: 153, b: 255}, {r: 153, g: 153, b: 255},
            {r: 153, g: 153, b: 255}, {r: 204, g: 153, b: 255}, {r: 255, g: 153, b: 255}, {r: 255, g: 153, b: 204},
            {r: 255, g: 153, b: 153}, {r: 255, g: 153, b: 153}, {r: 255, g: 153, b: 153}, {r: 255, g: 153, b: 153},
            {r: 255, g: 153, b: 153}, {r: 255, g: 153, b: 153}, {r: 255, g: 153, b: 153}, {r: 255, g: 204, b: 153},
            {r: 255, g: 255, b: 153}, {r: 204, g: 255, b: 153}, {r: 153, g: 255, b: 153}, {r: 153, g: 255, b: 153},
            {r: 153, g: 255, b: 153}, {r: 153, g: 255, b: 153}, {r: 153, g: 255, b: 153}, {r: 153, g: 255, b: 153},
            {r: 153, g: 255, b: 153}, {r: 153, g: 255, b: 204}, {r: 204, g: 204, b: 204}, {r: 102, g: 255, b: 255},
            {r: 102, g: 204, b: 255}, {r: 102, g: 153, b: 255}, {r: 102, g: 102, b: 255}, {r: 102, g: 102, b: 255},
            {r: 102, g: 102, b: 255}, {r: 102, g: 102, b: 255}, {r: 102, g: 102, b: 255}, {r: 153, g: 102, b: 255},
            {r: 204, g: 102, b: 255}, {r: 255, g: 102, b: 255}, {r: 255, g: 102, b: 204}, {r: 255, g: 102, b: 153},
            {r: 255, g: 102, b: 102}, {r: 255, g: 102, b: 102}, {r: 255, g: 102, b: 102}, {r: 255, g: 102, b: 102},
            {r: 255, g: 102, b: 102}, {r: 255, g: 153, b: 102}, {r: 255, g: 204, b: 102}, {r: 255, g: 255, b: 102},
            {r: 204, g: 255, b: 102}, {r: 153, g: 255, b: 102}, {r: 102, g: 255, b: 102}, {r: 102, g: 255, b: 102},
            {r: 102, g: 255, b: 102}, {r: 102, g: 255, b: 102}, {r: 102, g: 255, b: 102}, {r: 102, g: 255, b: 153},
            {r: 102, g: 255, b: 204}, {r: 153, g: 153, b: 153}, {r:  51, g: 255, b: 255}, {r:  51, g: 204, b: 255},
            {r:  51, g: 153, b: 255}, {r:  51, g: 102, b: 255}, {r:  51, g:  51, b: 255}, {r:  51, g:  51, b: 255},
            {r:  51, g:  51, b: 255}, {r: 102, g:  51, b: 255}, {r: 153, g:  51, b: 255}, {r: 204, g:  51, b: 255},
            {r: 255, g:  51, b: 255}, {r: 255, g:  51, b: 204}, {r: 255, g:  51, b: 153}, {r: 255, g:  51, b: 102},
            {r: 255, g:  51, b:  51}, {r: 255, g:  51, b:  51}, {r: 255, g:  51, b:  51}, {r: 255, g: 102, b:  51},
            {r: 255, g: 153, b:  51}, {r: 255, g: 204, b:  51}, {r: 255, g: 255, b:  51}, {r: 204, g: 255, b:  51},
            {r: 153, g: 244, b:  51}, {r: 102, g: 255, b:  51}, {r:  51, g: 255, b:  51}, {r:  51, g: 255, b:  51},
            {r:  51, g: 255, b:  51}, {r:  51, g: 255, b: 102}, {r:  51, g: 255, b: 153}, {r:  51, g: 255, b: 204},
            {r: 153, g: 153, b: 153}, {r:   0, g: 255, b: 255}, {r:   0, g: 204, b: 255}, {r:   0, g: 153, b: 255},
            {r:   0, g: 102, b: 255}, {r:   0, g:  51, b: 255}, {r:   0, g:   0, b: 255}, {r:  51, g:   0, b: 255},
            {r: 102, g:   0, b: 255}, {r: 153, g:   0, b: 255}, {r: 204, g:   0, b: 255}, {r: 255, g:   0, b: 255},
            {r: 255, g:   0, b: 204}, {r: 255, g:   0, b: 153}, {r: 255, g:   0, b: 102}, {r: 255, g:   0, b:  51},
            {r: 255, g:   0, b:   0}, {r: 255, g:  51, b:   0}, {r: 255, g: 102, b:   0}, {r: 255, g: 153, b:   0},
            {r: 255, g: 204, b:   0}, {r: 255, g: 255, b:   0}, {r: 204, g: 255, b:   0}, {r: 153, g: 255, b:   0},
            {r: 102, g: 255, b:   0}, {r:  51, g: 255, b:   0}, {r:   0, g: 255, b:   0}, {r:   0, g: 255, b:  51},
            {r:   0, g: 255, b: 102}, {r:   0, g: 255, b: 153}, {r:   0, g: 255, b: 204}, {r: 102, g: 102, b: 102},
            {r:   0, g: 204, b: 204}, {r:   0, g: 204, b: 204}, {r:   0, g: 153, b: 204}, {r:   0, g: 102, b: 204},
            {r:   0, g:  51, b: 204}, {r:   0, g:   0, b: 204}, {r:  51, g:   0, b: 204}, {r: 102, g:   0, b: 204},
            {r: 153, g:   0, b: 204}, {r: 204, g:   0, b: 204}, {r: 204, g:   0, b: 204}, {r: 204, g:   0, b: 204},
            {r: 204, g:   0, b: 153}, {r: 204, g:   0, b: 102}, {r: 204, g:   0, b:  51}, {r: 204, g:   0, b:   0},
            {r: 204, g:  51, b:   0}, {r: 204, g: 102, b:   0}, {r: 204, g: 153, b:   0}, {r: 204, g: 204, b:   0},
            {r: 204, g: 204, b:   0}, {r: 204, g: 204, b:   0}, {r: 153, g: 204, b:   0}, {r: 102, g: 204, b:   0},
            {r:  51, g: 204, b:   0}, {r:   0, g: 204, b:   0}, {r:   0, g: 204, b:  51}, {r:   0, g: 204, b: 102},
            {r:   0, g: 204, b: 153}, {r:   0, g: 204, b: 204}, {r: 102, g: 102, b: 102}, {r:   0, g: 153, b: 153},
            {r:   0, g: 153, b: 153}, {r:   0, g: 153, b: 153}, {r:   0, g: 102, b: 153}, {r:   0, g:  51, b: 153},
            {r:   0, g:   0, b: 153}, {r:  51, g:   0, b: 153}, {r: 102, g:   0, b: 153}, {r: 153, g:   0, b: 153},
            {r: 153, g:   0, b: 153}, {r: 153, g:   0, b: 153}, {r: 153, g:   0, b: 153}, {r: 153, g:   0, b: 153},
            {r: 153, g:   0, b: 102}, {r: 153, g:   0, b:  51}, {r: 153, g:   0, b:   0}, {r: 153, g:  51, b:   0},
            {r: 153, g: 102, b:   0}, {r: 153, g: 153, b:   0}, {r: 153, g: 153, b:   0}, {r: 153, g: 153, b:   0},
            {r: 153, g: 153, b:   0}, {r: 153, g: 153, b:   0}, {r: 102, g: 153, b:   0}, {r:  51, g: 153, b:   0},
            {r:   0, g: 153, b:   0}, {r:   0, g: 153, b:  51}, {r:   0, g: 153, b: 102}, {r:   0, g: 153, b: 153},
            {r:   0, g: 153, b: 153}, {r:  51, g:  51, b:  51}, {r:   0, g: 102, b: 102}, {r:   0, g: 102, b: 102},
            {r:   0, g: 102, b: 102}, {r:   0, g: 102, b: 102}, {r:   0, g:  51, b: 102}, {r:   0, g:   0, b: 102},
            {r:  51, g:   0, b: 102}, {r: 102, g:   0, b: 102}, {r: 102, g:   0, b: 102}, {r: 102, g:   0, b: 102},
            {r: 102, g:   0, b: 102}, {r: 102, g:   0, b: 102}, {r: 102, g:   0, b: 102}, {r: 102, g:   0, b: 102},
            {r: 102, g:   0, b:  51}, {r: 102, g:   0, b:   0}, {r: 102, g:  51, b:   0}, {r: 102, g: 102, b:   0},
            {r: 102, g: 102, b:   0}, {r: 102, g: 102, b:   0}, {r: 102, g: 102, b:   0}, {r: 102, g: 102, b:   0},
            {r: 102, g: 102, b:   0}, {r: 102, g: 102, b:   0}, {r:  51, g: 102, b:   0}, {r:   0, g: 102, b:   0},
            {r:   0, g: 102, b:  51}, {r:   0, g: 102, b: 102}, {r:   0, g: 102, b: 102}, {r:   0, g: 102, b: 102},
            {r:   0, g:   0, b:   0}, {r:   0, g:  51, b:  51}, {r:   0, g:  51, b:  51}, {r:   0, g:  51, b:  51},
            {r:   0, g:  51, b:  51}, {r:   0, g:  51, b:  51}, {r:   0, g:   0, b:  51}, {r:  51, g:   0, b:  51},
            {r:  51, g:   0, b:  51}, {r:  51, g:   0, b:  51}, {r:  51, g:   0, b:  51}, {r:  51, g:   0, b:  51},
            {r:  51, g:   0, b:  51}, {r:  51, g:   0, b:  51}, {r:  51, g:   0, b:  51}, {r:  51, g:   0, b:  51},
            {r:  51, g:   0, b:   0}, {r:  51, g:  51, b:   0}, {r:  51, g:  51, b:   0}, {r:  51, g:  51, b:   0},
            {r:  51, g:  51, b:   0}, {r:  51, g:  51, b:   0}, {r:  51, g:  51, b:   0}, {r:  51, g:  51, b:   0},
            {r:  51, g:  51, b:   0}, {r:   0, g:  51, b:   0}, {r:   0, g:  51, b:  51}, {r:   0, g:  51, b:  51},
            {r:   0, g:  51, b:  51}, {r:   0, g:  51, b:  51}, {r:  51, g:  51, b:  51}
        ];
        this.controlPoints = [
            {x: 0.00, r:    0, g:    0, b:  255},
            {x: 0.25, r:    0, g:  255, b:  255},
            {x: 0.50, r:    0, g:  255, b:    0},
            {x: 0.75, r:  255, g:  255, b:    0},
            {x: 1.00, r:  255, g:    0, b:    0}
        ];
        this.mousePressed = false;
        this.selectedControlPoint = -1;

        this.initializeLUTs();
    },

    initializeLUTs: function () {
        var lutBuilder = new cinema.utilities.LookupTableBuilder();
        this.registerLUT("Gray", function (value) {
            var v = Math.floor(value * 255);
            return [v, v, v];
        });
        this.registerLUT("Rainbow", lutBuilder.buildLUT([
            0.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 0.0
        ]));
        this.registerLUT("Cold To Warm", lutBuilder.buildLUT([
            0.0, 0.231373, 0.298039, 0.752941,
            0.5, 0.865003, 0.865003, 0.865003,
            1.0, 0.705882, 0.0156863, 0.14902
        ]));
    },

    render:  function () {
        this.$el.html(cinema.templates.lookupTable({
            luts: this.lutKeys,
            colors: this.swatchColors
        }));
        this.toolbarRendering.render();
        this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
        this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
        this.$('.c-maximum-x').html(this.clampMaximum.toFixed(3));
        this.$('select[data-type="lutName"]').trigger('change');
        this.lookuptableCanvas = this.$('.c-lookuptable-canvas')[0];
        this.context = this.lookuptableCanvas.getContext('2d');
        this.drawLookupTable();
    },

    drawControlPoints: function (ih, iw) {
        var i, y = ih * 0.5, radius = 5.0;

        for (i = 0; i < this.controlPoints.length; i = i + 1) {
            this.context.beginPath();
            this.context.moveTo(this.controlPoints[i].x * iw, 0);
            this.context.lineTo(this.controlPoints[i].x * iw, ih);
            this.context.lineWidth = 1;
            this.context.strokeStyle = 'black';
            this.context.stroke();
            this.context.beginPath();
            this.context.fillStyle = "rgb(R,G,B)".replace(/R/g, this.controlPoints[i].r)
                .replace(/G/g, this.controlPoints[i].g).replace(/B/g, this.controlPoints[i].b);
            this.context.arc(this.controlPoints[i].x * iw, y, radius, 0, 2 * Math.PI, false);
            this.context.fill();
            this.context.lineWidth = 2;
            if (this.selectedControlPoint === i) {
                this.context.strokeStyle = 'white';
            }
            else {
                this.context.strokeStyle = 'black';
            }
            this.context.stroke();
        }
    },

    drawLookupTable: function () {
        var iw = this.lookuptableCanvas.width,
            ih = this.lookuptableCanvas.height;

        this.context.clearRect(0, 0, iw, ih);

        this.drawLUTGradient(iw, ih);
        this.drawLUTBorder(iw, ih);
        if (this.editLookupTable) {
            this.drawControlPoints(ih, iw);
        }
    },

    drawLUTBorder: function (iw, ih) {
        this.context.beginPath();
        this.context.rect(0, 0, iw, ih);
        this.context.lineWidth = 1;
        this.context.strokeStyle = 'black';
        this.context.stroke();
    },

    drawLUTGradient: function (iw, ih) {
        var i;

        this.context.rect(0, 0, iw, ih);
        var grd = this.context.createLinearGradient(0, 0, iw, 0);
        for (i = 0; i < this.controlPoints.length; i = i + 1) {
            grd.addColorStop(this.controlPoints[i].x, "rgb(R,G,B)".replace(/R/g, this.controlPoints[i].r)
                .replace(/G/g, this.controlPoints[i].g).replace(/B/g, this.controlPoints[i].b));
        }
        this.context.fillStyle = grd;
        this.context.fill();
    },

    _refresh: function () {
    },

    change: function (param, value) {
        this._refresh();
    },

    findControlPoint: function (canvas, x) {
        var rect = canvas.getBoundingClientRect(),
            dx = 4/(rect.right - rect.left),
            i;
        this.selectedControlPoint = -1;
        for (i = 0; i < this.controlPoints.length; i = i + 1) {
            if (x < (this.controlPoints[i].x + dx) && x > (this.controlPoints[i].x - dx)) {
                this.selectedControlPoint = i;
            }
        }
    },

    findFrontItem: function (x) {
        var i,
            frontItem=1;
        for (i = 0; i < this.controlPoints.length; i = i + 1) {
            if (x > this.controlPoints[i].x) {
                frontItem = i + 1;
            }
        }
        return frontItem;
    },

    getMouseX: function (canvas, event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left)/(rect.right - rect.left)
        };
    },

    hideLightingEditor: function () {
        var link = this.$('.c-lighting-edit'),
            state;
        if (link.attr('state') === 'on') {
            state = 'off';
            link.attr('state', state);
            link.fadeOut();
        }
        else {
            state = 'on';
            link.attr('state', state);
            link.fadeIn();
        }
    },

    hideLookupTableEditor: function () {
        var link = this.$('.c-lookuptable-edit'),
            state;
        if (link.attr('state') === 'on') {
            state = 'off';
            link.attr('state', state);
            this.editLookupTable = false;
            link.fadeOut();
        }
        else {
            state = 'on';
            link.attr('state', state);
            this.editLookupTable = true;
            link.fadeIn();
        }
        this.drawLookupTable();
    },

    interpolate: function(x, i, component) {
        var value = 0,
            fraction = (x - this.controlPoints[i].x)/(this.controlPoints[i+1].x - this.controlPoints[i].x);

        if (component === 'r') {
            value = this.controlPoints[i].r + fraction * (this.controlPoints[i+1].r - this.controlPoints[i].r);
        }
        else if (component === 'g') {
            value = this.controlPoints[i].g + fraction * (this.controlPoints[i+1].g - this.controlPoints[i].g);
        }
        else if (component === 'b') {
            value = this.controlPoints[i].b + fraction * (this.controlPoints[i+1].b - this.controlPoints[i].b);
        }
        return Math.floor(value);
    },

    mapToClampedRange: function (x) {
        return this.clampMinimum + x * (this.clampMaximum - this.clampMinimum);
    },

    mapTo0To1Range: function (x) {
        return (x - this.clampMinimum) / (this.clampMaximum - this.clampMinimum);
    },

    updateColor: function (event) {
        var me = $(event.target);
        var color = me.attr('color').split(',');
        color[0] = Number(color[0]);
        color[1] = Number(color[1]);
        color[2] = Number(color[2]);
        this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
        if (this.selectedControlPoint !== -1) {
            this.controlPoints[this.selectedControlPoint].r = color[0];
            this.controlPoints[this.selectedControlPoint].g = color[1];
            this.controlPoints[this.selectedControlPoint].b = color[2];
            this.drawLookupTable();
        }
    },

    updateControlPoint: function (event) {
        var me = $(event.target),
            x,
            x0to1;
        console.log("updateControlPoint");
        if (!(me.validity && !me.validity.valid))
        {
            x = Number(me.val());

            if (this.selectedControlPoint === 0) {
                if (x < this.xMinimum) {
                    this.clampMinimum = this.xMinimum;
                    this.clampMidpoint = this.mapToClampedRange(0.5);
                    this.drawLookupTable();
                    this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
                    this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
                else if (x > this.xMaximum) {
                    this.clampMinimum = this.xMaximum;
                    this.clampMidpoint = this.mapToClampedRange(0.5);
                    this.drawLookupTable();
                    this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
                    this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));

                }
                else {
                    this.clampMinimum = x;
                    this.clampMidpoint = this.mapToClampedRange(0.5);
                    this.drawLookupTable();
                    this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
                    this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
            }
            else if (this.selectedControlPoint === (this.controlPoints.length - 1)) {
                if (x < this.xMinimum) {
                    this.clampMaximum = this.xMinimum;
                    this.clampMidpoint = this.mapToClampedRange(0.5);
                    this.drawLookupTable();
                    this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
                    this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
                else if (x > this.xMaximum) {
                    this.clampMaximum = this.xMaximum;
                    this.clampMidpoint = this.mapToClampedRange(0.5);
                    this.drawLookupTable();
                    this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
                    this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));

                }
                else {
                    this.clampMaximum = x;
                    this.clampMidpoint = this.mapToClampedRange(0.5);
                    this.drawLookupTable();
                    this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
                    this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
            }
            else {
                if (x > this.mapToClampedRange(this.controlPoints[this.selectedControlPoint + 1].x)) {
                    this.controlPoints[this.selectedControlPoint].x = this.controlPoints[this.selectedControlPoint + 1].x;
                    this.drawLookupTable();
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
                else if (x < this.mapToClampedRange(this.controlPoints[this.selectedControlPoint - 1].x)) {
                    this.controlPoints[this.selectedControlPoint].x = this.controlPoints[this.selectedControlPoint - 1].x;
                    this.drawLookupTable();
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
                else {
                    x0to1 = this.mapTo0To1Range(x);
                    this.controlPoints[this.selectedControlPoint].x = x0to1;
                    this.drawLookupTable();
                    this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                }
            }
        }
    },

    updateLightColor: function (event) {
        var me = $(event.target),
            color = me.attr('color').split(',');
        color[0] = Number(color[0]);
        color[1] = Number(color[1]);
        color[2] = Number(color[2]);

        console.log("updateLightColor");

        /* this.viewport.updateLightColor(color); */
    },

    updateLighting: function () {
        var lightTerms = {};
        this.$('input').each(function () {
            var me = $(this),
                name = me.attr('name'),
                value = Number(me.val());

            lightTerms[name] = value;
        });

        console.log("updateLighting");
        /* this.viewport.updateLightTerms(lightTerms); */
    },

    updateViewPort: function (event) {
        var origin = $(event.target),
            type = origin.attr('data-type'),
            that = this;
        if (type === 'light') {
            var vectorLight = [0, 0, 1];
            this.$('select[data-type="light"]').each(function () {
                var me = $(this),
                    idx = Number(me.attr('data-coordinate'));
                vectorLight[idx] = Number(me.val());
            });
            /* this.viewport.updateLight(vectorLight); */
        }
        /*
        else if (type === 'colorMapName') {
            this.viewport.updateTransferFunction(this.transferFunctionMap[origin.val()]);
        }
        */
        console.log("updateViewPort");
    }

});
