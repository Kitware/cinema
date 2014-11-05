/**
 * This is the top-level body page for the search UI.
 */
cinema.views.MetaDataCompositeSearchPage = Backbone.View.extend({
    events: {
        'click .c-search-page-next-results': 'handlePageNextResults'
    },

    initialize: function (settings) {
        this.visModel = settings.visModel;
        this.layerModel = settings.layerModel;
        this.searchModel = new cinema.models.MetaDataSearchModel({
            visModel: this.visModel
        });

        this.zoomWidth = $(window).width() * 0.23;

        this.resultIndex = 0;

        this.offscreenLayerModel = new cinema.models.LayerModel(this.visModel.getDefaultPipelineSetup(), { info: this.visModel });
        this.offscreenControlModel = new cinema.models.ControlModel({ info: this.visModel });
        this.offscreenViewpointModel = new cinema.models.ViewPointModel({ controlModel: this.offscreenControlModel });

        this.listenTo(cinema.events, 'c:handlesearchquery', this.handleSearchQuery);
        this.listenTo(cinema.events, 'c:handlesearchzoom', this.handleSearchZoom);
    },

    render: function () {
        this.$el.html(cinema.templates.compositeSearchPage());

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 100}
        });

        var viewpoint = this.offscreenControlModel.getControls();
        this.compositeSearchResultContainer = $(cinema.templates.compositeSearchResultContainer({
            viewpoint: viewpoint
        }));
        this.compositeSearchResultContainer.appendTo(this.$('.c-search-results-list-area'));

        this.offscreenVisualizationCanvasWidget = new cinema.views.VisualizationCanvasWidget({
            el: this.compositeSearchResultContainer,
            model: this.visModel,
            viewpoint: this.offscreenViewpointModel,
            layers: this.offscreenLayerModel
        }).render().showViewpoint();
        this.compositeSearchResultContainer.hide();
    },

    handlePageNextResults:  function () {
        $('.c-search-page-next-results').hide();
        if ((this.searchModel.results.length - this.resultIndex) > 12) {
            this.nextPageCount = 12;
            this._showNextResult();
        } else {
            this.nextPageCount = this.searchModel.results.length - this.resultIndex;
            this._showNextResult();
        }
    },

    handleSearchZoom:  function (event) {
        this.zoomWidth = Number(event.zoomWidth);
        this.$('.c-search-result-wrapper').css('width', this.zoomWidth).css('height', this.zoomWidth);
    },

    handleSearchQuery:  function (event) {
        this.clearResults();
        var that = this;
        $('.c-search-page-next-results').hide();
        $('.c-search-filter').val(event.searchQuery);

        setTimeout(function(){
            var expressions = event.searchQuery.split(' Sort By '),
                filterExpression,
                numberOfSearchResults = 0,
                sortExpression;

            if (expressions.length === 2) {
                console.log("if");
                filterExpression = that.searchModel.validateQuery(expressions[0]);
                sortExpression = that.searchModel.validateQuery(expressions[1]);
                if (filterExpression !== null && filterExpression !== '') {
                    numberOfSearchResults = that.searchModel.filterBy(filterExpression);
                } else {
                    numberOfSearchResults = that.searchModel.allResults();
                }
                if (numberOfSearchResults > 0 && sortExpression !== null && sortExpression !== '') {
                    that.searchModel.sortBy(sortExpression);
                }
                that.searchModel.setResultsList();
                if (numberOfSearchResults > 0) {
                    that._showResults();
                }
            }
            else if (expressions.length === 1) {
                filterExpression = that.searchModel.validateQuery(expressions[0]);
                if (filterExpression !== null && filterExpression !== '') {
                    numberOfSearchResults = that.searchModel.filterBy(filterExpression);
                } else {
                    numberOfSearchResults = that.searchModel.allResults();
                }
                that.searchModel.setResultsList();
                if (numberOfSearchResults > 0) {
                    that._showResults();
                }
            }
        }, 100);
    },

    clearResults: function () {
        $('.c-search-results-list-area').empty();
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
        this.nextPageCount = 12;

        this.$('.c-search-result-message').text(
            this.searchModel.results.length + ' results');

        this._showNextResult();
    },

    _showNextResult: function () {
        var self = this;

        if (this.searchModel.results.length <= this.resultIndex) {
            return;
        }

        var viewpoint = this.searchModel.results[this.resultIndex];
        var query = this.layerModel.serialize();
        this.offscreenVisualizationCanvasWidget.once('c:drawn', function () {
            self.resultIndex += 1;
            self.nextPageCount -= 1;
            var image = self.offscreenVisualizationCanvasWidget.getImage();
            image.onload = function() {
                $('<img src="' + image.src + '" class = "c-search-result-wrapper"/>').
                    attr('image-key', self.searchModel.objectToOrdinal(viewpoint)).
                    css('width', self.zoomWidth).
                    css('height', self.zoomWidth).
                    appendTo(self.$('.c-search-results-list-area'));
                $('html, body').scrollTop($('.c-search-result-wrapper').last().offset().top);
            };

            if (self.nextPageCount !== 0) {
                self._showNextResult();
            } else if (this.resultIndex < this.searchModel.results.length) {
                $('.c-search-page-next-results').show();
            } else {
                /*jshint -W035 */
            }

        }, this).updateTheQuery(query, viewpoint);
    }
});
