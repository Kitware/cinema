/**
 * This is the top-level body page for the search UI.
 */
cinema.views.StaticSearchPage = Backbone.View.extend({
    events: {
        'click .c-search-page-next-results': 'handlePageNextResults',
        'dblclick .c-search-result-wrapper': 'handlePageMigration'
    },

    initialize: function (settings) {
        this.basePath = settings.basePath;
        this.histogramModel = settings.histogramModel;
        this.visModel = settings.visModel;
        this.controlModel = settings.controlModel;

        this.zoomWidth = $(window).width() * 0.23;

        this.searchModel = new cinema.models.StaticSearchModel({
            basePath: this.basePath,
            histogramModel: this.histogramModel,
            visModel: this.visModel,
            controlModel: this.controlModel
        });

        this.resultIndex = 0;

        this.listenTo(cinema.events, 'c:handlesearchquery', this.handleSearchQuery);
        this.listenTo(cinema.events, 'c:handlesearchzoom', this.handleSearchZoom);
    },

    render: function () {
        this.$el.html(cinema.templates.staticSearchPage());

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 100}
        });

        this.staticSearchResultContainer = $(cinema.templates.staticSearchResultContainer({
            viewpoint: this.controlModel.getControls()
        }));
        this.staticSearchResultContainer.appendTo(this.$('.c-search-results-list-area'));
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

    handlePageMigration:  function (event) {
        this.controlModel.setControls(this.searchModel.ordinalToObject($(event.currentTarget).attr('image-key')));
        cinema.events.trigger('c:switchtorenderview');
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

    _showResults: function () {
        this.resultIndex = 0;
        this.nextPageCount = 12;

        this.$('.c-search-result-message').text(
            this.searchModel.results.length + ' results');

        this._showNextResult();
    },

    _showNextResult: function () {
        if (this.searchModel.results.length <= this.resultIndex) {
            return;
        }
        var viewpoint = this.searchModel.results[this.resultIndex],
            url = this.visModel.get('basePath') + "/" + this.visModel.getFilePattern(viewpoint);
        this.resultIndex += 1;
        this.nextPageCount -= 1;
        $('<img src="' + url + '" class = "c-search-result-wrapper"/>').
            attr('image-key', this.searchModel.objectToOrdinal(viewpoint)).
            css('width', this.zoomWidth).
            css('height', this.zoomWidth).
            appendTo(this.$('.c-search-results-list-area'));

        var lastContainer = $('.c-search-result-wrapper').last();
        if(lastContainer.length === 1) {
            $('html, body').scrollTop(lastContainer.offset().top);
        }


        if (this.nextPageCount !== 0) {
            this._showNextResult();
        } else if (this.resultIndex < this.searchModel.results.length) {
            $('.c-search-page-next-results').show();
        } else {
            /*jshint -W035 */
        }
    }
});
