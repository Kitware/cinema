cinema.views.ColorTransformationWidget = Backbone.View.extend({
    events: {
        'change select' : 'updateViewPort'
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
        this.transferFunctionMap = {
            Gray: function(value) {
                var v = Math.floor(value*256);
                return [v,v,v];
            },
            Rainbow: function(value) {
                // FIXME
                return [20,100,20];
            },
            'Cold to Hot': function(value) {
                // FIXME
                return [200,100,20];
            }
        };
        this.transferFunctionKeys = ['Gray', 'Rainbow', 'Cold to Hot'];
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

    updateViewPort: function(event) {
        var origin = $(event.target),
            type = origin.attr('data-type'),
            that = this;
        if(type === 'light') {
            var vectorLight = [0,0,1];
            this.$('select[data-type="light"]').each(function(){
                var me = $(this),
                    idx = Number(me.attr('data-coordinate'));
                vectorLight[idx] = Number(me.val());
            });
            this.viewport.updateLight(vectorLight);
        } else if(type === 'colorMapName') {
            this.viewport.updateTransfertFunction(this.transferFunctionMap[origin.val()]);
        }
    },
});
