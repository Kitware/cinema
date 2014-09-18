cinema.views.ColorTransformationWidget = Backbone.View.extend({
    events: {
        'change select' : 'updateViewPort',
        'click .color': 'updateLightColor',
        'change input': 'updateLighting'
    },

    registerNewLookupTable: function (name, func) {
        this.transferFunctionKeys.push(name);
        this.transferFunctionMap[name] = func;
    },

    initialize: function (settings) {
        if (!settings.viewport) {
            throw "Color Transformation widget requires a viewport.";
        }
        this.camera = settings.viewport.camera;
        this.viewport = settings.viewport;
        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.camera, 'change', this._refresh);
        this.transferFunctionMap = {};
        this.transferFunctionKeys = [];

        var lutBuilder = new cinema.utilities.LookupTableBuilder();
        this.registerNewLookupTable("Gray", function (value) { var v = Math.floor(value * 255); return [v, v, v]; });
        this.registerNewLookupTable("Rainbow", lutBuilder.buildLUT([
            0.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 0.0
        ]));
        this.registerNewLookupTable("Cold To Warm", lutBuilder.buildLUT([
            0.0, 0.231373, 0.298039, 0.752941,
            0.5, 0.865003, 0.865003, 0.865003,
            1.0, 0.705882, 0.0156863, 0.14902
        ]));
    },

    render: function () {
        this.$el.html(cinema.templates.colorTransformation({
            colormaps: this.transferFunctionKeys
        }));
    },

    _refresh: function () {
    },

    change: function (param, value) {
        this._refresh();
    },

    updateLightColor: function (event) {
        var me = $(event.target),
            color = me.attr('color').split(',');
        color[0] = Number(color[0]);
        color[1] = Number(color[1]);
        color[2] = Number(color[2]);

        this.viewport.updateLightColor(color);
    },

    updateLighting: function () {
        var lightTerms = {};
        this.$('input').each(function(){
            var me = $(this),
                name = me.attr('name'),
                value = Number(me.val());

            lightTerms[name] = value;
        });

        this.viewport.updateLightTerms(lightTerms);
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
            this.viewport.updateLight(vectorLight);
        } else if (type === 'colorMapName') {
            this.viewport.updateTransfertFunction(this.transferFunctionMap[origin.val()]);
        }
    }
});
