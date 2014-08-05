cinema.views.ViewportView = Backbone.View.extend({
    initialize: function (settings) {
        this.infoModel = settings.infoModel;

        this.infoModel.on('change', function () {
            this.render();
        }, this);
    },

    render: function () {
        console.log(this.infoModel);
    }
});
