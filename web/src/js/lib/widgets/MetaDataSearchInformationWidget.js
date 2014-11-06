cinema.views.MetaDataSearchInformationWidget = Backbone.View.extend({
    events: {

    },

    initialize: function (settings) {
        this.controlModel = settings.controlModel;
        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarSearchInformation = new cinema.views.MetaDataSearchInformationToolbar({el: settings.toolbarSelector});
        this.exclude = settings.exclude || [];

        this.listenTo(cinema.events, 'c:infocontrols', this.toggleControlInformation);


        if(this.model.has("control")) {
            this.order = this.model.get("control").order;
        } else {
            this.order = [];
            var that = this;

            // Create an ordered list of controls
            _.each(this.model.get("arguments"), function (value, key, list) {
                that.order.push(key);
            });

            // FIXME should reorder that list at some point
        }
        this.order = _.difference(this.order, this.exclude);
    },

    render:  function () {
        var metadata;
        if (!this.model.loaded()) {
            return;
        }

        metadata = this.model.get('metadata');

        this.$('.c-control-panel-body').html(cinema.templates.metaDataSearchInformation({
            metadata: metadata,
            controlMap: this.controlModel.getControlMap(),
            order: this.order
        }));

        this.toolbarSearchInformation.setElement(this.$(this.toolbarSelector)).render();

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    },

    toggleControlInformation: function () {
        this.$('.c-controls-info').fadeToggle();
    }

});
