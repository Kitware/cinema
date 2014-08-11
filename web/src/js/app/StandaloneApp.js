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

        new cinema.views.ViewportView({
            el: this.$('.c-app-viewport-container'),
            visModel: visModel
        });
        visModel.fetch();
    }
});
