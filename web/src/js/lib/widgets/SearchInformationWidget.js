cinema.views.SearchInformationWidget = Backbone.View.extend({
    events: {

    },

    initialize: function (settings) {
        this.controlModel = settings.controlModel;
        var defaultLayers = this.model.getDefaultPipelineSetup();
        this.layers = settings.layers || new cinema.models.LayerModel(defaultLayers, { info: this.model });
        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarSearchInformation = new cinema.views.SearchInformationToolbar({el: settings.toolbarSelector});
        this.exclude = settings.exclude || [];

        this.listenTo(cinema.events, 'c:infopipelines', this.togglePipelineInformation);
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

        this.$('.c-control-panel-body').html(cinema.templates.searchInformation({
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

    togglePipelineInformation: function () {
        this.$('.c-pipelines-info').fadeToggle();

    },

    toggleControlInformation: function () {
        this.$('.c-controls-info').fadeToggle();
    }

});
