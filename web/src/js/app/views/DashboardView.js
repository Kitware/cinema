/*
 * Main dashboard view that is capable of displaying multiple different layouts.
 */
cinema.views.DashboardView = Backbone.View.extend({

    initialize: function (opts) {
        this._template = opts.template || cinema.app.templates.dashboard2x1Layout;
    },

    setTemplate: function (template) {
        this._tempate = template;
        this.render();
    },

    render: function () {
        this.$el.html(this._template());
    }

});

cinema.router.route('dashboard', 'dashboard', function () {
    cinema.events.trigger('c:app.showPage', cinema.views.DashboardView, {}, true);
});
