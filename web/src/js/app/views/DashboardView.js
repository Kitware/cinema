/*
 * Main dashboard view that is capable of displaying multiple different layouts.
 */
cinema.views.DashboardView = Backbone.View.extend({

    initialize: function (opts) {
        this._template = opts.template || cinema.app.templates.dashboardGridLayout;
        this._layoutOptions = opts.layoutOptions || { grid: {rows: 2, cols: 3} };
    },

    setTemplate: function (template) {
        this._tempate = template;
        this.render();
    },

    render: function () {
        this.$el.html(this._template(this._layoutOptions));
    }

});

cinema.router.route('dashboard', 'dashboard', function () {
    cinema.events.trigger(
        'c:app.showPage',
        cinema.views.DashboardView,
        {},
        true,
        cinema.views.HeaderViewDashboard,
        {}
    );
});
