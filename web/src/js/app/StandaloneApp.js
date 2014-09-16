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

        Backbone.history.start({
            pushState: false
        });
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

        new cinema.views.RenderViewPage({
            el: this.$('.c-app-body-container'),
            visModel: visModel
        }).render();
    }
});
