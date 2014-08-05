cinema.StandaloneApp = Backbone.View.extend({
    initialize: function (settings) {
        this.dataRoot = settings.dataRoot;
        this.staticRoot = settings.staticRoot;

        this.render();

        // Initialize the routing system
        Backbone.history.start({
            pushState: false
        });
    },

    render: function () {
        this.$el.html(cinema.app.templates.layout());

        var infoModel = new cinema.models.JsonModel();
        infoModel.url = this.dataRoot + '/info.json';

        new cinema.views.ViewportView({
            el: this.$('#c-app-viewport-container'),
            infoModel: infoModel
        });
        infoModel.fetch();
    }
});
