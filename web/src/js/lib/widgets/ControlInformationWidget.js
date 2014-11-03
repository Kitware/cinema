cinema.views.ControlInformationWidget = Backbone.View.extend({

    initialize: function (settings) {
        this.model = settings.model;
        this.controlModel = settings.controlModel;
        this.order = settings.order;
    },

    render: function () {
        this.$el.html(cinema.templates.controlInformation({
            controlMap: this.controlModel.getControlMap(),
            order: this.order
        }));
    }

});
