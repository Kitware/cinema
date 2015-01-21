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

    },

    initialize: function (settings) {
        this.dataRoot = settings.dataRoot;
        cinema.staticRoot = this.staticRoot = settings.staticRoot;

        // When additional view type are added just expand the given list
        this.allowedViewType = ['view', 'workbench'];

        this.model = new cinema.models.VisualizationModel({
            basePath: this.dataRoot,
            infoFile: 'info.json'
        });
        cinema.model = this.model;

        this.listenTo(this.model, 'change', this.render);

        this.model.fetch();
    },

    render: function () {
        this.model = cinema.model;

        if (!this.model.loaded()) {
            return;
        }

        var desired = cinema.model.attributes.metadata.type;
        // Make sure we have a valid view type
        if (!desired || !_.contains(this.allowedViewType, desired)) {
            cinema.viewType = 'view';
        }

        // Find out what the view control list is for control panel container
        var viewInfo = cinema.viewMapper.getView(cinema.model.getDataType(), 'view');
        this._currentView = new viewInfo.view({
            defaultControls: viewInfo.opts.controls,
            model: this.model
        });

        // Create container for control panels
        var controlList = this._currentView.controlList || viewInfo.opts.controls;
        this.$el.html(cinema.app.templates.layout({
            controlList: controlList,
            viewType: cinema.viewType
        }));

        // Handle header bar base on application type (workbench/cinema)
        var title;
        title = 'Cinema';
        this.$('.header-right').html(cinema.app.templates.cinemaControl({controlList: controlList}));

        this.$('.header-left').html(cinema.app.templates.headerLeft({
            icon: 'icon-cinema',
            title: title,
            active: cinema.viewType
        }));

        this.$('[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });

        var container = this.$el;
        this._currentView.setElement(container).render();

        return this;
    }
});
