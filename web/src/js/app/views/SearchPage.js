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

        this.searchModel.on('c:done', this._showResults, this);

        var renderChildren = function () {
            pipelineControlView.render();
        };

        if (this.visModel.loaded()) {
            renderChildren();
            this.searchModel.compute();
        }

        this.listenTo(this.visModel, 'change', function () {
            renderChildren();
        });

        this.listenTo(pipelineControlView.layers, 'change', function () {
            this.searchModel.compute();
        }, this);
    },

    clearResults: function () {
        this.$('.c-search-results-list-area').empty();
    },

    _showResults: function () {
        this.resultIndex = 0;
        this.clearResults();
        this.$('.c-search-result-message').text(
            this.searchModel.results.length + ' results');

        this._showNextResult();
    },

    _showNextResult: function () {
        if (this.searchModel.results.length <= this.resultIndex) {
            return;
        }

        var viewpoint = this.searchModel.results[this.resultIndex];
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
        }).on('c:drawn', function () {
            // TODO figure out why drawImage is happening more than it should.
            this.resultIndex += 1;
            this._showNextResult();
        }, this).render().showViewpoint();
    }
});

cinema.router.route('search', 'search', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.SearchPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
