cinema.StandaloneApp = Backbone.View.extend({
    initialize: function (settings) {
        this.dataRoot = settings.dataRoot;
        this.staticRoot = settings.staticRoot;

        this.render();
    },

    render: function () {
        this.$el.html(cinema.app.templates.layout());

        var visModel = new cinema.models.VisualizationModel({
            basePath: this.dataRoot,
            infoFile: 'info.json'
        });

        new cinema.views.HeaderView({
            el: this.$('.c-app-header-container')
        }).render();

        var viewportView = new cinema.views.ViewportView({
            el: this.$('.c-app-viewport-container'),
            visModel: visModel
        });

        var pipelineControlView = new cinema.views.PipelineControlWidget({
            el: this.$('.c-app-pipeline-control-container'),
            visModel: visModel
        });

        pipelineControlView.on('c:query.update', function (query) {
            viewportView.updateQuery(query);
        });

        visModel.on('change', function () {
            viewportView.render();
            pipelineControlView.render();
        }, this).fetch();
    }
});
