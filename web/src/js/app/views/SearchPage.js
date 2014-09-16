/**
 * This is the top-level body page for the search UI.
 */
cinema.views.SearchPage = Backbone.View.extend({
    events: {
        'click .c-search-filter-apply': function (e) {
            event.preventDefault();
            // TODO apply search filters
        }
    },

    initialize: function (opts) {
        this.visModel = opts.visModel;
    },

    render: function () {
        this.$el.html(cinema.app.templates.searchPage());

        this.$('.c-filter-help-button,.c-search-filter-apply').tooltip({
            placement: 'bottom',
            delay: {show: 100}
        });

        var pipelineControlView = new cinema.views.PipelineControlWidget({
            el: this.$('.c-search-pipeline-control-container'),
            model: this.visModel
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
    }

});

cinema.router.route('search', 'search', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.SearchPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
