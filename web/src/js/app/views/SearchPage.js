/**
 * This is the top-level body page for the search UI.
 */
cinema.views.SearchPage = Backbone.View.extend({
    initialize: function (opts) {
        this.visModel = opts.visModel;
    },

    render: function () {
        this.$el.html(cinema.app.templates.searchPage());
    }

});

cinema.router.route('search', 'search', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.SearchPage, {
        visModel: cinema.standaloneVisModel
    }, true);
});
