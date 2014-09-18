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

        this.histogramModel = new cinema.models.HistogramModel({
            layerModel: pipelineControlView.layers,
            basePath: this.visModel.basePath
        });

        var renderChildren = function () {
            pipelineControlView.render();
        };

        if (this.visModel.loaded()) {
            renderChildren();
        }

        this.listenTo(this.visModel, 'change', function () {
            renderChildren();
        });

        this.listenTo(pipelineControlView.layers, 'change', function () {
            this.executeSearch();
        }, this);
    },

    clearResults: function () {
        this.$('.c-search-results-list-area').empty();
    },

    executeSearch: function () {
        this.clearResults();
        this.histogramModel.off('changed').on('changed', function () {
            this._showResults();
        }, this).fetch();
    },

    showResults: function () {
        // TODO grab the results and show them
        console.log(this.histogramModel);
    }
});

cinema.router.route('search', 'search', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.SearchPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
