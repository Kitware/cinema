cinema.views.SearchInformationWidget = Backbone.View.extend({
    events: {

    },

    initialize: function (settings) {
        this.controlModel = settings.controlModel;
        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarSearchInformation = new cinema.views.SearchInformationToolbar({el: settings.toolbarSelector});
        console.log(this.controlModel.getControlMap());
    },

    render:  function () {
        this.$('.c-control-panel-body').html(cinema.templates.searchInformation(

        ));
        this.toolbarSearchInformation.setElement(this.$(this.toolbarSelector)).render();

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    }

});
