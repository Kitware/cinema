cinema.views.WorkbenchView = Backbone.View.extend({
    initialize: function () {
        this.configuration = {
            layout: { rows: 1, cols: 1 },
            template: 'workbenchGridLayout',
            models: {}
        };

        // Fetch the models for each run in the list
        _.each(this.model.get('runs'), function (run) {
            var internalModel = new cinema.models.VisualizationModel({
                basePath: this.model.get('basePath') + '/' + run.path,
                infoFile: 'info.json'
            });
            this.configuration.models[run.path] = internalModel;
            internalModel.fetch();
        }, this);

        this.currentRun = null;
        this._elementWidgets = [];
    },

    render: function () {
        this.$el.html(cinema.templates[this.configuration.template]({
            layout: this.configuration.layout
        }));

        // TODO we need to fix all this at some point, it's the wrong way
        // to do this.
        var view = this;
        $('.header-right .c-wb-layout').off().on('click', function (e) {
            var me = $(e.target),
                rows = Number(me.attr('data-rows')),
                cols = Number(me.attr('data-cols')),
                templateName = me.attr('data-template');
            if (templateName) {
                view.configuration.layout = { rows: rows, cols: cols };
                view.configuration.template = templateName;
                view.render();
            }
        });

        $('.header-right .c-vis-option').off().on('click', function (e) {
            var path = $(e.currentTarget).attr('path');
            if (!view.currentRun || view.currentRun !== path) {
                view.currentRun = path;
                view.setCurrentRun();
            }
        });

        if (this.currentRun) {
            this.setCurrentRun();
        }
    },

    setCurrentRun: function () {
        // Call remove on all previously created sub-widgets to propagate cleanup
        _.each(this._elementWidgets, function (widget) {
            widget.remove();
        });
        this._elementWidgets = [];

        var count = 0;
        _.each(this.$('.c-dv-layout-item'), function (el) {
            $(el).removeClass('empty').off();
            this._elementWidgets.push(new cinema.views.WorkbenchElementWidget({
                el: el,
                model: this.configuration.models[this.currentRun],
                containerUid: count
            }).render());
            count += 1;
        }, this);
    }
});

cinema.viewMapper.registerView('workbench', 'view', cinema.views.WorkbenchView, {
    controls: []
});
