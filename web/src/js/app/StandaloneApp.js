var viewMap = { 'view': null, 'search': null };

cinema.StandaloneApp = Backbone.View.extend({
    events: {
        // Handle control panel close action
        'click .c-control-panel-header .panel-close': function (e) {
            var panel = $(e.currentTarget).parents('.c-control-panel');
            cinema.events.trigger('toggle-control-panel', { panel: panel, key: panel.attr('key'), visible: false });
            panel.fadeOut();
        },

        // Handle control panel toggle visibility action
        'click .c-visibility-button': function (e) {
            var origin = $(e.target),
                panel = $('.' + origin.attr('container-class'));
            cinema.events.trigger('toggle-control-panel', { panel: panel, key: panel.attr('key'), visible: !panel.is(':visible') });
            panel.fadeToggle();
        },

        // Handle search navigation
        'click .c-search-filter-apply': function (e) {
            if (cinema.viewType !== 'search') {
                cinema.viewType = 'search';
                this.render();
            }
            var searchQuery = $('.c-search-filter').val();
            cinema.searchQuery = searchQuery;
            cinema.events.trigger('c:handlesearchquery', {searchQuery: searchQuery});
        },

        'click .c-app-icon': 'switchToRenderView',

        'keyup .c-search-filter': function (e) {
            if (e.keyCode === 13) {
                if (cinema.viewType !== 'search') {
                    cinema.viewType = 'search';
                    this.render();
                }
                var searchQuery = $(e.currentTarget).val();
                cinema.searchQuery = searchQuery;
                cinema.events.trigger('c:handlesearchquery', {searchQuery: searchQuery});
            }
        }
    },

    initialize: function (settings) {
        this.dataRoot = settings.dataRoot;
        cinema.staticRoot = this.staticRoot = settings.staticRoot;

        // When additional view type are added just expand the given list
        this.allowedViewType = ['view', 'search'];

        this.model = new cinema.models.VisualizationModel({
            basePath: this.dataRoot,
            infoFile: 'info.json'
        });
        cinema.model = this.model;

        this.listenTo(this.model, 'change', this.render);
        this.listenTo(cinema.events, 'c:switchtorenderview', this.switchToRenderView);

        this.model.fetch();
    },

    render: function () {
        if (!this.model.loaded()) {
            return;
        }

        // Make sure we have a view type valid
        if (!cinema.viewType || !_.contains(this.allowedViewType, cinema.viewType)) {
            cinema.viewType = 'view';
        }

        // Find out what the view control list is for control panel container
        var viewInfo = cinema.viewMapper.getView(cinema.model.getDataType(), cinema.viewType);

        if (viewMap[cinema.viewType] === null) {
            this._currentView = new viewInfo.view({
                defaultControls: viewInfo.opts.controls,
                model: this.model
            });
            viewMap[cinema.viewType] = this._currentView;
        } else {
            this._currentView = viewMap[cinema.viewType];
        }

        // Create container for control panels
        var controlList = this._currentView.controlList || viewInfo.opts.controls;
        this.$el.html(cinema.app.templates.layout({
            controlList: controlList,
            viewType: cinema.viewType
        }));

        // Handle header bar base on application type (workbench/cinema)
        var title;
        if (cinema.model.getDataType() === 'workbench') {
            title = 'Workbench';
            this.$('.header-right').html(cinema.app.templates.workbenchControl({
                runs: cinema.model.get('runs')
            }));
        } else {
            title = 'Cinema';
            this.$('.header-right').html(cinema.app.templates.cinemaControl({controlList: controlList}));
            this.$('.header-center').html(cinema.app.templates.cinemaSearch({query: cinema.searchQuery}));
        }

        this.$('.header-left').html(cinema.app.templates.headerLeft({
            icon: 'icon-cinema',
            title: title,
            active: cinema.viewType
        }));

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });

        var container = this.model.getDataType() === 'workbench' ? this.$('.c-body-container') : this.$el;
        this._currentView.setElement(container).render();

        // Set the background color based on the metadata value, if any.  This
        // will return white unless there is a bg color specified in metadata.
        container.css('background-color', this.model.getBackgroundColor());

        return this;
    },

    switchToRenderView: function () {
        cinema.viewType = 'view';
        this.render();
    }
});
