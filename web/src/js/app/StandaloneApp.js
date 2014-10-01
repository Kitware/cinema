cinema.StandaloneApp = Backbone.View.extend({
    events: {
        // Handle control panel close action
        'click .c-control-panel-header .panel-close': function (e) {
            $(e.currentTarget).parents('.c-control-panel').fadeOut();
        },

        // Handle control panel toggle visibility action
        'click .c-visibility-button': function (e) {
            var origin = $(e.target),
                panel = $('.' + origin.attr('container-class'));
            panel.fadeToggle();
        },

        // Handle view navigation
        'click .view-navigation': function (e) {
            var origin = $(e.target).closest('.view-navigation'),
                viewRoute = origin.attr('data-link');
            cinema.router.navigate('#' + viewRoute, { trigger: true });
        }
    },

    initialize: function (settings) {
        this.dataRoot = settings.dataRoot;
        this.staticRoot = settings.staticRoot;

        // When additional view type are added just expand the given list
        this.allowedViewType = ['view', 'search', 'cost', 'view-webgl', 'view-webgl-jpg', 'view-webgl-compcalc'];
        this.views = [
            { label: 'Exploration', name: 'view', icon: 'icon-compass-1'},
            { label: 'Exploration (WebGL)', name: 'view-webgl', icon: 'icon-compass'},
            { label: 'Exploration (WebGL JPG)', name: 'view-webgl-jpg', icon: 'icon-picture'},
            { label: 'Exploration (Compute Composite + WebGL)', name: 'view-webgl-compcalc', icon: 'icon-globe'},
            { label: 'Search', name: 'search', icon: 'icon-search'},
            { label: 'Cost', name: 'cost', icon: 'icon-dollar'},
        ];

        this.model = new cinema.models.VisualizationModel({
            basePath: this.dataRoot,
            infoFile: 'info.json'
        });
        cinema.model = this.model;

        Backbone.history.start({
            pushState: false
        });

        this.listenTo(this.model, 'change', this.render);
        this.model.fetch();
    },

    render: function () {
        if (!this.model.loaded()) {
            return;
        }

        // Make sure we have a view type valid
        if (cinema.viewType === null || cinema.viewType === undefined || cinema.viewType === '' || !_.contains(this.allowedViewType, cinema.viewType)) {
            cinema.viewType = 'view';
        }

        // Find out what the view control list is for control panel container
        var controlList = cinema.viewFactory.getViewControlList('body', cinema.viewType, cinema.model);

        // Create container for control panels
        this.$el.html(cinema.app.templates.layout({controlList:controlList}));

        // Handle header bar base on application type (workbench/cinema)
        if (cinema.model.getDataType() === 'workbench') {
            // Workbench Cinema App
            this.$('.header-left').html(cinema.app.templates.headerLeft({icon: 'icon-cinema', title: 'Workbench', active: cinema.viewType, views: this.views}));
            this.$('.header-right').html(cinema.app.templates.workbenchControl());
        } else {
            // Single Cinema App
            this.$('.header-left').html(cinema.app.templates.headerLeft({icon: 'icon-cinema', title: 'Cinema', active: cinema.viewType, views: this.views}));
            this.$('.header-right').html(cinema.app.templates.cinemaControl({controlList:controlList}));
        }

        // Fill the layout base on the type of the view and model.
        cinema.viewFactory.render('body', cinema.viewType, cinema.model);

        // Create nice tooltip for the full page
        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });

        return this;
    }
});
