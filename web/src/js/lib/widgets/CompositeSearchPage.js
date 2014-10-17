/**
 * This is the top-level body page for the search UI.
 */
cinema.views.CompositeSearchPage = Backbone.View.extend({
    events: {

    },

    initialize: function (settings) {
        this.basePath = settings.basePath;
        this.visModel = settings.visModel;
        this.layerModel = settings.layerModel;

        this.listenTo(cinema.events, 'c:handlesearchquery', this.handleSearchQuery);
    },

    render: function () {
        this.$el.html(cinema.templates.compositeSearchPage());

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 100}
        });

        this.searchModel = new cinema.models.SearchModel({
            basePath: this.basePath,
            visModel: this.visModel,
            layerModel: this.layerModel
        });

        this.searchModel.off('c:done').on('c:done', this._showResults, this);

        if (this.visModel.loaded()) {
            this.searchModel.compute();
        }

        /*TODO listen to main toolsthis.listenTo(pipelineView.layers, 'change', function () {
            this.searchModel.compute();
        }, this);*/
    },

    handleSearchQuery:  function (event) {
        var expressions = event.searchQuery.split(' Sort By '),
            numberOfSearchResults = 0;
        if (expressions.length == 2) {
            var filterExpression = this.searchModel.validateQuery(expressions[0]);
            var sortExpression = this.searchModel.validateQuery(expressions[1]);
            if (filterExpression != null && filterExpression != '') {
                numberOfSearchResults = this.searchModel.filterBy(filterExpression);
                console.log('# ', numberOfSearchResults);
            }
            if (numberOfSearchResults > 0 && sortExpression != null && sortExpression != '') {
                this.searchModel.sortBy(sortExpression);
            }
        }
        else if (expressions.length == 1) {
            var filterExpression = this.searchModel.validateQuery(expressions[0]);
            if (filterExpression != null && filterExpression != '') {
                numberOfSearchResults = this.searchModel.filterBy(filterExpression);
                console.log('# ', numberOfSearchResults);
            }
        }
    },

    clearResults: function () {
        // TODO do we need to remove all the widgets manually?
        this.$('.c-search-results-list-area').empty();
    },

    /** Returns whether we are at the bottom of the page */
    _canScroll: function () {
        return this.$('.c-search-page-bottom').visible(true);
    },

    _setScrollWaypoint: function () {
        var view = this;
        Scrollpoints.add(this.$('.c-search-page-bottom')[0], function () {
            if (view.searchModel.results) {
                view._showNextResult();
            }
        });
    },

    _showResults: function () {
        this.resultIndex = 0;
        this.clearResults();
        // The issue is that the this.$el is detached and needs
        // to be re-assign with the setElement method.

        this.$('.c-search-result-message').text(
             this.searchModel.results.length + ' results');

        this._showNextResult();
    },

    _showNextResult: function () {
        if (this.searchModel.results.length <= this.resultIndex) {
            return;
        }

        var viewpoint = this.searchModel.results[this.resultIndex];
        var el = $(cinema.templates.compositeSearchResultContainer({
            viewpoint: viewpoint
        }));

        el.appendTo(this.$('.c-search-results-list-area'));

        var controlModel = new cinema.models.ControlModel({ info: this.visModel }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel });

        controlModel.setControls(viewpoint);

        new cinema.views.VisualizationCanvasWidget({
            el: el,
            model: this.visModel,
            viewpoint: viewpointModel,
            layers: this.layerModel
        }).once('c:drawn', function () {
            this.resultIndex += 1;

            if (this._canScroll()) {
                this._showNextResult();
            } else {
                this._setScrollWaypoint();
            }
        }, this).render().showViewpoint();
    }
});
