cinema.views.ViewportView = Backbone.View.extend({

    initialize: function () {
        this.$el.html(cinema.app.templates.viewport());

        this.camera = new cinema.models.CameraModel({
            info: this.model
        });

        this.renderView = new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-app-renderer-container'),
            model: this.model,
            camera: this.camera
        }).render();

        this.mouseInteractor = new cinema.utilities.RenderViewMouseInteractor({
            renderView: this.renderView,
            camera: this.camera
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        }).enableDragPan({
            keyModifiers: cinema.keyModifiers.SHIFT
        }).enableDragRotation({
            keyModifiers: null
        });

        this.listenTo(this.camera, 'change', this._refreshCamera);
    },

    updateQuery: function (query) {
        this.renderView.updateQuery(query);
    },

    _refreshCamera: function () {
        this.renderView.showViewpoint();
    },
});
