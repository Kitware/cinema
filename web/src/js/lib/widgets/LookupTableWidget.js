cinema.views.LookupTableWidget = Backbone.View.extend({
    events: {
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

    render: function () {
        this.$el.html(cinema.templates.lookupTable({
            luts: this.lutKeys
        }));
        this.$('select[data-type="lutName"]').trigger('change');
    },

    _refresh: function () {
    },

    change: function (param, value) {
        this._refresh();
    },

    updateViewPort: function (event) {
        var origin = $(event.target),
            type = origin.attr('data-type');
        if (type === 'lutName') {
            /* this.viewport.updateLookupTable(this.lutMap[origin.val()]); */
        }
    }
});
