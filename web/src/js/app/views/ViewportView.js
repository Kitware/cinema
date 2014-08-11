cinema.views.ViewportView = Backbone.View.extend({
    initialize: function (settings) {
        this.visModel = settings.visModel;

        this.visModel.on('change', function () {
            this.render();
        }, this);
    },

    render: function () {
        this.$el.html(cinema.app.templates.viewport());

        var renderView = new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-app-renderer-container'),
            visModel: this.visModel
        }).render();

        new cinema.utilities.RenderViewMouseInteractor({
            renderView: renderView
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        });
    }
});
