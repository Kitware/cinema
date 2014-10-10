
cinema.views.ChartToolsWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.controlModel = settings.controlModel || new cinema.models.ControlModel({ info: this.model });
        this.viewpoint = settings.viewpoint || new cinema.models.ViewPointModel({ controlModel: this.controlModel });
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        this.$('.c-control-panel-body').html(cinema.templates.chartToolsWidget());

        this.listenTo(cinema.events, 'c:editchart', this.toggleChartEditor);
        this.listenTo(cinema.events, 'c:editcontrols', this.toggleControlEditor);

        this.chartWidget = new cinema.views.ChartWidget({
            el: this.$('.c-chart-content'),
            model: this.model
        });

        this.controlWidget = new cinema.views.ControlWidget({
            el: this.$('.c-control-content'),
            model: this.model,
            viewport: this.viewpoint,
            controlModel: this.controlModel,
            toolbarSelector: this.toolbarSelector,
            toolbarRootView: this,
            exclude: ['layer', 'field', 'filename']
        });

        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.chartToolsWidget());
        this.chartWidget.setElement(this.$('.c-chart-content')).render();
        this.controlWidget.setElement(this.$('.c-control-content')).render();
    },

    toggleChartEditor: function () {
        this.$('.c-chart-edit').fadeToggle();

    },

    toggleControlEditor: function () {
        this.$('.c-control-edit').fadeToggle();
    }

});
