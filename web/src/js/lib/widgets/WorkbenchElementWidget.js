/**
 * This widget occupies an element of a layout in the workbench. It begins in
 * a state that allows users to select from any of the available viewable
 * datasets in the workbench list, then renders the selected view.
 */
cinema.views.WorkbenchElementWidget = Backbone.View.extend({
    events: {
        'click .c-run-option': function (e) {
            var id = $(e.currentTarget).attr('run-id');
            this._showRun(this.runOptions[id]);
        }
    },

    /**
     * This widget should be initialized with a visModel as the model parameter
     * and optionally a pre-existing CompositeImageManager.
     */
    initialize: function (settings) {
        // TODO handle the case where this model is not loaded yet.

        // Map IDs to run info
        this.runOptions = {};
        _.each(this.model.get('runs'), function (run) {
            this.runOptions[run.path] = run;
        }, this);
    },

    render: function (settings) {
        this.$el.html(cinema.templates.workbenchElement({
            runs: this.model.get('runs')
        }));

        this.$('.c-run-select').tooltip({
            placement: 'right',
            container: this.el
        });
    },

    _showRun: function (run) {
        var visModel = new cinema.models.VisualizationModel({
            basePath: this.model.basePath + '/' + run.path,
            infoFile: 'info.json'
        });

        visModel.on('change', function () {
            cinema.viewFactory.render(this.$('.c-run-container'), 'view', visModel);
            this.$('.c-side-panel-title').text(visModel.get('metadata').title);
        }, this).fetch();
    }
});
