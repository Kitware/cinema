cinema.StandaloneApp = Backbone.View.extend({
    events: {
        'click .c-control-panel-header a.close': function (e) {
            $(e.currentTarget).parents('.c-control-panel').fadeOut();
        }
    },

    initialize: function (settings) {
        this.dataRoot = settings.dataRoot;
        this.staticRoot = settings.staticRoot;

        this.visModel = new cinema.models.VisualizationModel({
            basePath: this.dataRoot,
            infoFile: 'info.json'
        });

        // This should go away once we have more than one visModel.
        cinema.standaloneVisModel = this.visModel;

        this.render();

        cinema.events.on('c:app.showPage', this.showPage, this);

        Backbone.history.start({
            pushState: false
        });

        this.visModel.fetch();
    },

    render: function () {
        this.$el.html(cinema.app.templates.layout());

        new cinema.views.HeaderView({
            el: this.$('.c-app-header-container')
        }).render();

        return this;
    },

    /**
     * Shows a new page within the main body view. This should be called
     * by route handlers that wish to display a specific view within the
     * app body container.
     */
    showPage: function (view, settings, render) {
        /*jshint -W055 */
        var bodyView = new view(_.extend(settings, {
            el: this.$('.c-app-body-container').off()
        }));

        if (render) {
            bodyView.render();
        }
    }
});

// Make empty route redirect to #renderview
cinema.router.route('', 'index_redirect', function () {
    cinema.router.navigate('renderview', {trigger: true});
});
