/**
 * This is the top-level body page for the search UI.
 */
cinema.views.SearchPage = Backbone.View.extend({
    events: {
        'click .c-search-filter-apply': function (e) {
            e.preventDefault();
            // TODO apply search filters
        },

        'click .c-search-toggle-layers': function (e) {
            e.preventDefault();
            this.$('.c-search-layers-panel').fadeToggle();
        }
    },

    initialize: function (opts) {
        this.visModel = opts.visModel;
    },

    render: function () {
        this.$el.html(cinema.app.templates.searchPage());

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 100}
        });

        var pipelineControlView = new cinema.views.PipelineControlWidget({
            el: this.$('.c-search-layer-control-container'),
            model: this.visModel
        });

        this.searchModel = new cinema.models.SearchModel({
            layerModel: pipelineControlView.layers
        });

        this.searchModel.on('c:result', this._showResult, this);

        var renderChildren = function () {
            pipelineControlView.render();
        };

        if (this.visModel.loaded()) {
            renderChildren();
            this.searchModel.fetch();
        }

        this.listenTo(this.visModel, 'change', function () {
            renderChildren();
        });

        this.listenTo(pipelineControlView.layers, 'change', function () {
            this.clearResults();
            this.searchModel.fetch();
        }, this);
    },

    clearResults: function () {
        this.$('.c-search-results-list-area').empty();
    },

    _showResult: function (viewpoint) {
        var el = $(cinema.app.templates.searchResultContainer({
            viewpoint: viewpoint
        }));

        el.appendTo(this.$('.c-search-results-list-area'));

        var camera = new cinema.models.CameraModel({
            info: this.visModel
        });
        camera.setViewpoint(viewpoint);

        new cinema.views.VisualizationCanvasWidget({
            el: el,
            model: this.visModel,
            camera: camera,
            layers: this.searchModel.layerModel
        }).render().showViewpoint();
    }
});

cinema.router.route('search', 'search', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.SearchPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
