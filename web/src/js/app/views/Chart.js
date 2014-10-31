cinema.views.ChartView = Backbone.View.extend({
    initialize: function () {
        this.controlModel = new cinema.models.ControlModel({info: this.model});
        this.viewpointModel = new cinema.models.ViewPointModel({
            controlModel: this.controlModel
        });

        this.controlModel.on('change', this.refreshCamera, this);
        this.viewpointModel.on('change', this.refreshCamera, this);
        this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
    },

    render: function () {
        if (this.renderView) {
            this.renderView.remove();
        }
        this.renderView = new cinema.views.ChartVisualizationCanvasWidget({
            el: this.$('.c-body-container'),
            model: this.model,
            controlModel: this.controlModel,
            viewpoint: this.viewpointModel
        });

        this.chartTools = new cinema.views.ChartToolsWidget({
            el: this.$('.c-tools-panel'),
            model: this.model,
            controlModel: this.controlModel,
            viewport: this.renderView,
            toolbarSelector: '.c-panel-toolbar'
        });

        return this;
    },

    refreshCamera: function () {
        this.renderView.showViewpoint();
    },

    resetCamera: function () {
        this.renderView.resetCamera();
    }
});

cinema.viewMapper.registerView('parametric-chart-stack', 'view', cinema.views.ChartView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});
