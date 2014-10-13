/**
 * This widget occupies an element of a layout in the workbench. It begins in
 * a state that allows users to select from any of the available viewable
 * datasets in the workbench list, then renders the selected view.
 */
cinema.views.WorkbenchElementWidget = Backbone.View.extend({
    events: {
        'click .c-analysis-option': function (e) {
            var id = $(e.currentTarget).attr('analysis-id');
            this._showAnalysis(this.analysisOptions[id]);
        }
    },

    /**
     * This widget should be initialized with a visModel as the model parameter
     * and optionally a pre-existing CompositeImageManager.
     */
    initialize: function (settings) {
        // TODO handle the case where this model is not loaded yet.

        // Map IDs to analysis info
        this.analysisOptions = {};
        _.each(this.model.get('analysis'), function (analysis) {
            this.analysisOptions[analysis.id] = analysis;
        }, this);
    },

    render: function (settings) {
        this.$el.html(cinema.templates.workbenchElement({
            analyses: this.model.get('analysis')
        }));

        this.$('.c-analysis-select').tooltip({
            placement: 'right',
            container: this.el
        });
    },

    _showAnalysis: function (analysis) {
        var visModel = new cinema.models.VisualizationModel({
            basePath: this.model.basePath + '/' + analysis.id,
            infoFile: 'info.json'
        });

        visModel.on('change', function () {
            cinema.viewFactory.render(this.$('.c-analysis-container'), 'view', visModel);
        }, this).fetch();
    }
});