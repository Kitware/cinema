cinema.views.HeaderViewDashboard = cinema.views.HeaderView.extend({
    events: {
        'click .c-db-header-2x2': function () { this.showGrid(2, 2); },
        'click .c-db-header-3x2': function () { this.showGrid(2, 3); },
        'click .c-db-header-1large': function () { this.showLeftLarge(); }
    },

    initialize: function () {
        this._template = cinema.app.templates.dashboardHeader;
        this._templateOptions = {};
    },

    showGrid: function (rows, cols) {
        cinema.events.trigger(
            'c:app.showPage',
            cinema.views.DashboardView,
            {
                template: cinema.app.templates.dashboardGridLayout,
                layoutOptions: { grid: {rows: rows, cols: cols}}
            },
            true,
            cinema.views.HeaderViewDashboard,
            {}
        );
    },

    showLeftLarge: function (rows, cols) {
        cinema.events.trigger(
            'c:app.showPage',
            cinema.views.DashboardView,
            {
                template: cinema.app.templates.dashboardOneLargeView,
                layoutOptions: {}
            },
            true,
            cinema.views.HeaderViewDashboard,
            {}
        );
    }
});
