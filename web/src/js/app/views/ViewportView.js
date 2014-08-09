cinema.views.ViewportView = Backbone.View.extend({
    initialize: function (settings) {
        this.visModel = settings.visModel;

        this.visModel.on('change', function () {
            this.render();
        }, this);
    },

    render: function () {
        this.$el.html(cinema.app.templates.viewport());

        new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-app-renderer-container'),
            visModel: this.visModel
        }).render();
    }
});
