cinema.views.ViewportView = Backbone.View.extend({
    initialize: function (settings) {
        this.visModel = settings.visModel;

        this.visModel.on('change', function () {
            this.render();
        }, this);
    },

    render: function () {
        new cinema.views.VisualizationCanvasWidget({
            el: this.el,
            visModel: this.visModel
        }).render();
    }
});
