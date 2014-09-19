cinema.StandaloneApp = Backbone.View.extend({
    events: {
        'click .c-control-panel-header .panel-close': function (e) {
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

        this.visModel.imageManager = new cinema.utilities.CompositeImageManager({
            visModel: this.visModel
        });

        // This should go away once we have more than one visModel.
        cinema.standaloneVisModel = this.visModel;
        cinema.viewFactory.updateRootModel(this.visModel);

        this.render();

        cinema.events.on('c:app.showPage', this.showPage, this);

        Backbone.history.start({
            pushState: false
        });

        this.visModel.fetch();
    },

    render: function () {
        this.$el.html(cinema.app.templates.layout());
        this.updateHeader();

        return this;
    },

    /**
     * Shows a new page within the main body view. This should be called
     * by route handlers that wish to display a specific view within the
     * app body container.
     */
    showPage: function (view, viewSettings, render, header, headerSettings) {
        /*jshint -W055 */
        var bodyView = new view(_.extend(viewSettings, {
            el: this.$('.c-app-body-container').off()
        }));

        this.updateHeader(header, headerSettings);

        if (render) {
            bodyView.render();
        }
    },

    /**
     * Rerender the header given a specific header subclass defaulting to
     * a bare, view agnostic header.
     */
    updateHeader: function (header, settings) {
        header = header || cinema.views.HeaderView;
        settings = settings || {};
        settings.el = this.$('.c-app-header-container');

        new header(settings).render();
    }
});

// Make empty route redirect to #renderview
cinema.router.route('', 'index_redirect', function () {
    cinema.router.navigate('renderview', {trigger: true});
});
