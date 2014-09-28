/**
 * This is the top-level body page for the search UI.
 */
cinema.views.CompositeSearchPage = Backbone.View.extend({
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
        this.$el.html(cinema.templates.compositeSearchPage());

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 100}
        });

        var pipelineView = new cinema.views.PipelineWidget({
            el: this.$('.c-search-layer-control-container'),
            model: this.visModel
        });

        this.searchModel = new cinema.models.SearchModel({
            layerModel: pipelineView.layers
        });

        this.searchModel.on('c:done', this._showResults, this);

        var renderChildren = function () {
            pipelineView.render();
        };

        if (this.visModel.loaded()) {
            renderChildren();
            this.searchModel.compute();
        }

        this.listenTo(this.visModel, 'change', function () {
            renderChildren();
        });

        this.listenTo(pipelineView.layers, 'change', function () {
            this.searchModel.compute();
        }, this);
    },

    clearResults: function () {
        this.$('.c-search-results-list-area').empty();
    },

    _showResults: function () {
        this.resultIndex = 0;
        this.clearResults();
        // The issue is that the this.$el is detached and needs
        // to be re-assign with the setElement method.

        console.log("Search parent element: " + this.$el.lenght);
        console.log("Search result msg element: " + this.$('.c-search-result-message').lenght);

        // this.$('.c-search-result-message').text(
        //     this.searchModel.results.length + ' results');

        // this._showNextResult();
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

        var fieldsModel = new cinema.models.FieldModel({ info: this.visModel }),
            viewpointModel = new cinema.models.ViewPointModel({ fields: fieldsModel });

        // FIXME viewpointModel.setViewpoint(viewpoint);

        new cinema.views.VisualizationCanvasWidget({
            el: el,
            model: this.visModel,
            viewpoint: viewpointModel,
            layers: this.searchModel.layerModel
        }).on('c:drawn', function () {
            // TODO figure out why drawImage is happening more than it should.
            this.resultIndex += 1;
            this._showNextResult();
        }, this).render().showViewpoint();
    }
});
