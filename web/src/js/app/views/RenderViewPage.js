cinema.views.RenderViewPage = Backbone.View.extend({
    initialize: function (opts) {
        this.visModel = opts.visModel;
    },

    render: function () {
        this.$el.html(cinema.app.templates.renderViewPage());

        var layers = new cinema.models.LayerModel(this.visModel.defaultLayers());
        var viewportView = new cinema.views.ViewportView({
            el: this.$('.c-rv-viewport-container'),
            model: this.visModel,
            layers: layers
        });

        var pipelineControlView = new cinema.views.PipelineControlWidget({
            el: this.$('.c-rv-pipeline-control-container'),
            model: this.visModel,
            layers: layers
        });

        cinema.events.on('c:app.show-pipeline-controls', function () {
            this.$('.c-rv-pipeline-panel').fadeIn();
        }, this).on('c:app.show-view-controls', function () {
            this.$('.c-rv-view-panel').fadeIn();
        }, this);

        var pipelineAnimationWidget = new cinema.views.PipelineAnimationWidget({
            el: this.$('.c-rv-view-control-container'),
            model: this.visModel,
            viewport: viewportView
        });

        this.listenTo(this.visModel, 'change', function () {
            viewportView.render();
            pipelineControlView.render();
            pipelineAnimationWidget.render();
        });
        this.visModel.fetch();
    }
});
