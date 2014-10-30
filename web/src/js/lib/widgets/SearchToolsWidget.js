cinema.views.SearchToolsWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.layers = settings.layers || new cinema.models.LayerModel(this.model.defaultLayers());
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        this.$('.c-control-panel-body').html(cinema.templates.searchToolsWidget());

        this.listenTo(cinema.events, 'c:editpipelines', this.togglePipelineEditor);
        this.listenTo(cinema.events, 'c:editsearchoptions', this.toggleSearchOptionsEditor);

        this.pipelineWidget = new cinema.views.PipelineWidget({
            el: this.$('.c-pipeline-content'),
            model: this.model,
            layers: this.layers
        });

        this.searchOptionsWidget = new cinema.views.SearchOptionsWidget({
            el: this.$('.c-search-options-content'),
            toolbarSelector: this.toolbarSelector,
            toolbarRootView: this
        });
        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.searchToolsWidget());
        this.pipelineWidget.setElement(this.$('.c-pipeline-content')).render();
        this.searchOptionsWidget.setElement(this.$('.c-search-options-content')).render();
    },

    togglePipelineEditor: function () {
        this.$('.c-pipeline-edit').fadeToggle();

    },

    toggleSearchOptionsEditor: function () {
        this.$('.c-search-options-edit').fadeToggle();
    }

});
