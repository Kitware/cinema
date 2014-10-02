cinema.views.RenderingWidget = Backbone.View.extend({
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
                var color = [ (255 * this.controlPoints[this.selectedControlPoint].r).toFixed(0),
                              (255 * this.controlPoints[this.selectedControlPoint].g).toFixed(0),
                              (255 * this.controlPoints[this.selectedControlPoint].b).toFixed(0) ];
                this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
                this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
            }
            this.drawLookupTable();
        }
    },

    mouseUp: function (e) {
        if (this.editLookupTable) {
            this.mousePressed = false;
            this.updateLookupTable();
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
                color = [ (255 * this.controlPoints[this.selectedControlPoint].r).toFixed(0),
                          (255 * this.controlPoints[this.selectedControlPoint].g).toFixed(0),
                          (255 * this.controlPoints[this.selectedControlPoint].b).toFixed(0) ];
                this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
                this.$('.c-lookuptable-x').val(this.mapToClampedRange(this.controlPoints[this.selectedControlPoint].x));
                this.drawLookupTable();
                this.updateLookupTable();
            }
            else {
                if (this.selectedControlPoint !== 0 && this.selectedControlPoint !== (this.controlPoints.length - 1)) {
                    color = [ (255 * this.controlPoints[this.selectedControlPoint].r).toFixed(0),
                              (255 * this.controlPoints[this.selectedControlPoint].g).toFixed(0),
                              (255 * this.controlPoints[this.selectedControlPoint].b).toFixed(0) ];
                    this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
                    this.controlPoints.splice(this.selectedControlPoint, 1);
                    this.selectedControlPoint = -1;
                    this.drawLookupTable();
                    this.updateLookupTable();
                }
            }
        }
    },

    initialize: function (settings) {
        if (!settings.viewport) {
            throw "Lookup table widget requires a viewport.";
        }
        this.controlModel = settings.viewport.controlModel;
        this.viewpoint = settings.viewport.viewpoint;
        this.viewport = settings.viewport;
        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarRendering = new cinema.views.RenderingToolbar({el: settings.toolbarSelector});
        this.editLookupTable = true;
        this.xMinimum = 0.0;
        this.xMaximum = 1.0;
        this.clampMinimum = this.xMinimum;
        this.clampMaximum = this.xMaximum;
        this.clampMidpoint = this.mapToClampedRange(0.5);
        this.mousePressed = false;
        this.selectedControlPoint = -1;
        this.lutName = "spectral";

        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.controlModel, 'change', this._refresh);
        this.listenTo(cinema.events, 'c:editlookuptable', this.toggleLookupTableEditor);
        this.listenTo(cinema.events, 'c:editlighting', this.toggleLightingEditor);

        this.renderingModel = new cinema.models.RenderingModel({
            url: '/rendering/rendering.json'
        });
        this.listenTo(this.renderingModel, 'change', this.readyRenderingModel);
        this.renderingModel.fetch();
    },

    readyRenderingModel: function () {
        var lookuptables = this.renderingModel.getData('lookuptables'),
            swatches = this.renderingModel.getData('swatches');

        this.lutMap = {};
        this.lutKeys = _.keys(lookuptables);
        this.swatchColors = swatches.colors;
        this.controlPoints = this.renderingModel.getControlPoints(this.lutName);
        this.render();
    },

    render:  function () {
        if (this.renderingModel.loaded()) {
            this.$('.c-control-panel-body').html(cinema.templates.rendering({
                luts: this.lutKeys,
                colors: this.swatchColors
            }));
            this.toolbarRendering.setElement(this.$(this.toolbarSelector)).render();
            this.$('.c-minimum-x').html(this.clampMinimum.toFixed(3));
            this.$('.c-midpoint-x').html(this.clampMidpoint.toFixed(3));
            this.$('.c-maximum-x').html(this.clampMaximum.toFixed(3));
            this.lookuptableCanvas = this.$('.c-lookuptable-canvas')[0];
            if (this.lookuptableCanvas) {
                this.context = this.lookuptableCanvas.getContext('2d');
                this.drawLookupTable();
            }
            var lutSelect = this.$('select[data-type="lutName"]');
            lutSelect.empty();
            for (var j = 0; j < this.lutKeys.length; j = j + 1){
                lutSelect.append("<option value='" +this.lutKeys[j]+ "'>" +this.lutKeys[j]+ "</option>");
            }
            lutSelect.trigger('change');
        }
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
            this.context.fillStyle = "rgb(R,G,B)"
                .replace(/R/g, (255 * this.controlPoints[i].r).toFixed(0))
                .replace(/G/g, (255 * this.controlPoints[i].g).toFixed(0))
                .replace(/B/g, (255 * this.controlPoints[i].b).toFixed(0));
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
            grd.addColorStop(this.controlPoints[i].x, "rgb(R,G,B)"
                .replace(/R/g, (255 * this.controlPoints[i].r).toFixed(0))
                .replace(/G/g, (255 * this.controlPoints[i].g).toFixed(0))
                .replace(/B/g, (255 * this.controlPoints[i].b).toFixed(0)));
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

    toggleLightingEditor: function () {
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

    toggleLookupTableEditor: function () {
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
            this.controlPoints[this.selectedControlPoint].r = color[0]/255.0;
            this.controlPoints[this.selectedControlPoint].g = color[1]/255.0;
            this.controlPoints[this.selectedControlPoint].b = color[2]/255.0;
            this.drawLookupTable();
            this.updateLookupTable();
        }
    },

    updateControlPoint: function (event) {
        var me = $(event.target),
            x,
            x0to1;
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
                this.updateLookupTable();
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
                this.updateLookupTable();
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
                this.updateLookupTable();
            }
        }
    },

    updateLightColor: function (event) {
        var me = $(event.target),
            color = me.attr('color').split(',');
        color[0] = Number(color[0]);
        color[1] = Number(color[1]);
        color[2] = Number(color[2]);

        this.viewport.setLightColor(color);
        this.viewport.forceRedraw();
    },

    updateLighting: function () {
        var lightTerms = {};
        this.$('input').each(function () {
            var me = $(this),
                name = me.attr('name'),
                value = Number(me.val());
            lightTerms[name] = value;
        });
        this.updateLightTerms(lightTerms);
    },

    updateLight: function (vectorLight) {
        this.viewport.setLight(vectorLight);
        this.viewport.forceRedraw();
    },

    updateLightTerms: function (terms) {
        this.viewport.setLightTerms(terms);
        this.viewport.forceRedraw();
    },

    updateLookupTable: function () {
        var lutFunction = this.renderingModel.getLookupTableFunction(this.lutName);
        this.viewport.setLUT(lutFunction);
        this.viewport.forceRedraw();
    },

    updateViewPort: function (event) {
        var origin = $(event.target),
            type = origin.attr('data-type');
        if (type === 'light') {
            var vectorLight = [0, 0, 1];
            this.$('select[data-type="light"]').each(function () {
                var me = $(this),
                    idx = Number(me.attr('data-coordinate'));
                vectorLight[idx] = Number(me.val());
            });
            this.updateLight(vectorLight);
        }
        else if (type === 'lutName') {
            this.lutName = origin.val();
            this.controlPoints = this.renderingModel.getControlPoints(this.lutName);
            this.updateLookupTable();
            this.drawLookupTable();
        }
    }
});
