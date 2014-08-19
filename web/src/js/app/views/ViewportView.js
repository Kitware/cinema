cinema.views.ViewportView = Backbone.View.extend({
    initialize: function (settings) {
        this.visModel = settings.visModel;
    },

    render: function () {
        this.$el.html(cinema.app.templates.viewport());

        this.renderView = new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-app-renderer-container'),
            visModel: this.visModel
        }).render();

        new cinema.utilities.RenderViewMouseInteractor({
            renderView: this.renderView
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        }).enableDragPan({
            keyModifiers: cinema.keyModifiers.SHIFT
        }).enableDragRotation({
            keyModifiers: null
        });
    },

    updateQuery: function (query) {
        this.renderView.updateQuery(query);
    }
});
