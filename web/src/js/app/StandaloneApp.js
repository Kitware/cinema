cinema.StandaloneApp = Backbone.View.extend({
    events: {
        'click .c-control-panel-header a.close': function (e) {
            $(e.currentTarget).parents('.c-control-panel').fadeOut();
        }
    },

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

        cinema.events.on('c:app.show-pipeline-controls', function () {
            this.$('.c-app-pipeline-panel').fadeIn();
        }, this).on('c:app.show-view-controls', function () {
            this.$('.c-app-view-panel').fadeIn();
        }, this);

        visModel.on('change', function () {
            viewportView.render();
            pipelineControlView.render();
        }, this).fetch();
    }
});
