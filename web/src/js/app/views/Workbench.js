(function () {
    cinema.views.WorkbenchView = Backbone.View.extend({
        initialize: function () {
            this.configuration = {
            models: {}
            };

            // Fetch the models for each run in the list
        _.each(this.model.get('runs'), function (run) {
            var internalModel = new cinema.models.VisualizationModel({
                basePath: this.model.get('basePath') + '/' + run.path,
                infoFile: 'info.json'
            });
            this.configuration.models[run.title] = internalModel;
            internalModel.fetch();
        }, this);

            this.currentRun = null;
        this._elementWidgets = [];
        },

        render: function () {

            this.$el.html(cinema.templates['workbenchElement']({
            models: this.configuration.models,
            }));

            var title;
            title = 'Cinema';

            this.$('.header-left').html(cinema.app.templates.headerLeft({
                icon: 'icon-cinema',
                title: title,
                active: cinema.viewType
            }));

            var menu = $('#sophie')
            menu.on("mouseup", data=this, function(e){ e.data.setRun() });

        },

        setRun : function () {

            var modelIDX = $('select#sophie option:selected').val()
            var visModel = this.configuration.models[modelIDX];
            cinema.model = visModel;
            cinema.view.dataRoot = visModel.basePath;
            cinema.view.render();
        }

    });

    cinema.viewMapper.registerView('workbench', 'view', cinema.views.WorkbenchView, {
        controls: []
    });

}());
