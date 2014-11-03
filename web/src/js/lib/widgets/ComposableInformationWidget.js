/**
 * This widget provides the ability to compose two search information widgets
 */
cinema.views.ComposableInformationWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.controlModel = settings.controlModel || new cinema.models.ControlModel({ info: this.model });
        //this.layers = settings.layers || new cinema.models.LayerModel(this.model.defaultLayers());
        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarSearchInformation = new cinema.views.SearchInformationToolbar({el: settings.toolbarSelector});
        this.analysisInfo = settings.analysisInfo;

        this.listenTo(cinema.events, 'c:infopipelines', this.toggleMainInformation);
        this.listenTo(cinema.events, 'c:infocontrols', this.toggleControlInformation);

        /*
        this.mainInfoWidget = new cinema.views.PipelineInformationWidget({
            el: this.$('.c-main-info-content'),
            model: this.model,
            layers: this.layers
        });
        */

        this.mainInfoWidget = new cinema.views.StaticInformationWidget({
            el: this.$('.c-main-info-content'),
            model: this.model,
            analysisInfo: this.analysisInfo
        });

        this.controlInfoWidget = new cinema.views.ControlInformationWidget({
            el: this.$('.c-control-info-content'),
            model: this.model,
            controlModel: this.controlModel,
            order: ['time', 'phi', 'theta']
        });

        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.composableInformation());
        this.toolbarSearchInformation.setElement(this.$(this.toolbarSelector)).render();
        this.mainInfoWidget.setElement(this.$('.c-main-info-content')).render();
        this.controlInfoWidget.setElement(this.$('.c-control-info-content')).render();
    },

    toggleMainInformation: function () {
        this.$('.c-main-info-section').fadeToggle();

    },

    toggleControlInformation: function () {
        this.$('.c-control-info-section').fadeToggle();
    }

});
