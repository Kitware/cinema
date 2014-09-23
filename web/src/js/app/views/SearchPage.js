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
            layerModel: pipelineControlView.layers,
            visModel: this.visModel
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

        var view = this;

        Scrollpoints.add(this.$('.c-search-page-bottom')[0], function () {
            if (view.searchModel.results) {
                view._showNextResult();
            }
        }, {
            when: 'entered',
            once: false
        });
    },

    clearResults: function () {
        this.$('.c-search-results-list-area').empty();
    },

    /** Returns whether we are at the bottom of the page */
    _canScroll: function () {
        return !this.$('.c-search-page-bottom').visible(true);
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

        var fieldModel = new cinema.models.FieldModel({
            info: this.visModel
        });
        fieldModel.setField('time', viewpoint.time);
        fieldModel.setField('phi', viewpoint.phi);
        fieldModel.setField('theta', viewpoint.theta);

        var vpModel = new cinema.models.ViewPointModel({
            info: this.visModel,
            fields: fieldModel
        });

        new cinema.views.VisualizationCanvasWidget({
            el: el,
            model: this.visModel,
            fields: fieldModel,
            viewpoint: vpModel,
            layers: this.searchModel.layerModel
        }).on('c:drawn', function () {
            this.resultIndex += 1;

            if (!this._canScroll()) {
                this._showNextResult();
            }
        }, this).render().showViewpoint();
    }
});

cinema.router.route('search', 'search', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.SearchPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
