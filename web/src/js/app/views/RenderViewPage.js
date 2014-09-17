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
        if (this.visModel.loaded()) {
            this.invalidateContent();
        }

        this.listenTo(this.visModel, 'change', function () {
            this.invalidateContent();
        });
    },

    invalidateContent: function() {
        cinema.viewFactory.updateRootModel(this.visModel);
        this.$el.html(cinema.app.templates.renderViewPage({
            controlPanels: cinema.viewFactory.getControls('RenderView')
        }));
        cinema.viewFactory.createView(this, 'RenderView');
    }
});

cinema.router.route('renderview', 'renderview', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.RenderViewPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
