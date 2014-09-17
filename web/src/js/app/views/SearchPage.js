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
            var el = this.$('.c-search-layers-panel');

            e.preventDefault();

            if (el.is(':visible')) {
                el.fadeOut();
            } else {
                el.fadeIn();
            }
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
