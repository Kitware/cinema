/**
 * This view is the top-level body view for viewing a visualization model. It
 * contains widgets for controlling the pipeline (layers, coloring, camera
 * parameters) and allows for mouse interaction with the scene.
 */
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

        var renderChildren = function () {
            viewportView.render();
            pipelineControlView.render();
            pipelineAnimationWidget.render();
        };

        if (this.visModel.loaded()) {
            renderChildren();
        }

        this.listenTo(this.visModel, 'change', function () {
            renderChildren();
        });
    }
});

cinema.router.route('renderview', 'renderview', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.RenderViewPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
