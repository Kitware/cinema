cinema.views.LookupTableWidget = Backbone.View.extend({
    events: {
        'click .color': 'updateColor'
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
        this.viewport = settings.viewport;
        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.fields, 'change', this._refresh);
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
        this.$('select[data-type="lutName"]').trigger('change');
        this.drawControlPoints();
    },

    drawControlPoints: function () {
        var lookuptableCanvas = this.$('.c-lookuptable-canvas')[0],
            iw = lookuptableCanvas.width,
            ih = lookuptableCanvas.height;
        var controlPoints = [
            {x: 0.00, r:  0, g:  0, b:  255},
            {x: 0.25, r:  0, g:  255, b:  255},
            {x: 0.50, r:  0, g:  255, b:  0},
            {x: 0.75, r:  255, g:  255, b:  0},
            {x: 1.00, r:  255, g:  0, b:  0}
        ];
        var context = lookuptableCanvas.getContext('2d');

        context.clearRect(0, 0, iw, ih);

        var i;
        context.rect(0, 0, iw, ih);
        var grd = context.createLinearGradient(0, 0, iw, 0);
        for (i = 0; i < controlPoints.length; i = i + 1) {
            grd.addColorStop(controlPoints[i].x, "rgb(R,G,B)".replace(/R/g, controlPoints[i].r)
                .replace(/G/g, controlPoints[i].g).replace(/B/g, controlPoints[i].b));
        }
        context.fillStyle = grd;
        context.fill();

        context.beginPath();
        context.rect(0, 0, iw, ih);
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.stroke();

        var y, radius = 5.0;
        y = ih * 0.5;
        controlPoints.forEach(function (cp) {
            context.beginPath();
            context.moveTo(cp.x * iw, 0);
            context.lineTo(cp.x * iw, ih);
            context.lineWidth = 1;
            context.strokeStyle = 'black';
            context.stroke();
            context.beginPath();
            context.fillStyle = "rgb(R,G,B)".replace(/R/g, cp.r).replace(/G/g, cp.g).replace(/B/g, cp.b);
            context.arc(cp.x * iw, y, radius, 0, 2 * Math.PI, false);
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = 'black';
            context.stroke();
        });
    },

    _refresh: function () {
    },

    change: function (param, value) {
        this._refresh();
    },

    updateColor: function (event) {
        var me = $(event.target);
        var color = me.attr('color').split(',');
        color[0] = Number(color[0]);
        color[1] = Number(color[1]);
        color[2] = Number(color[2]);
        console.log(color);
        this.$('.c-lookuptable-color').css('background', "rgb(" + color.join(', ') + ")");
    },

    updateViewPort: function (event) {
        var origin = $(event.target),
            type = origin.attr('data-type');
        /*
        if (type === 'lutName') {
            this.viewport.updateLookupTable(this.lutMap[origin.val()]);
        }
        */
    }
});
