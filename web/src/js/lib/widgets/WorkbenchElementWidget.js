/**
 * This widget occupies an element of a layout in the workbench. It begins in
 * a state that allows users to select from any of the available viewable
 * datasets in the workbench list, then renders the selected view.
 */
cinema.views.WorkbenchElementWidget = Backbone.View.extend({
    events: {
        'click .c-run-option': function (e) {
            var id = $(e.currentTarget).attr('run-id');
            this.showRun(this.runOptions[id]);
        },

        'click .c-side-panel-toggle': function (e) {
            var el = $(e.currentTarget),
                state = el.attr('state');

            if (state === 'open') {
                el.attr('state', 'closed').attr('title', 'Show controls');
                el.find('i').removeClass('icon-angle-circled-up')
                            .addClass('icon-angle-circled-down');
                this.$('.c-control-panel-body').hide();
            } else {
                el.attr('state', 'open').attr('title', 'Minimize controls');
                el.find('i').removeClass('icon-angle-circled-down')
                            .addClass('icon-angle-circled-up');
                this.$('.c-control-panel-body').show();
            }
        },

        'click .c-control-modal': function (e) {
            var key = $(e.currentTarget).attr('key');
            if (key === this.controlMode) {
                return;
            }
            this.$('a.c-'+this.controlMode+'-mode').attr('state', 'inactive');
            this.$('a.c-'+key+'-mode').attr('state', 'active');

            this.$('.c-'+this.controlMode+'-panel').addClass('hide');
            this.$('.c-'+key+'-panel').removeClass('hide');

            this.controlMode = key;
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

        return this;
    },

    showRun: function (run) {
        var visModel = new cinema.models.VisualizationModel({
            basePath: this.model.basePath + '/' + run.path,
            infoFile: 'info.json'
        });

        visModel.on('change', function () {
            var title = visModel.get('metadata').title;
            var viewInfo = cinema.viewMapper.getView(visModel.getDataType(), 'view');

            if (this._visWidget) {
                this._visWidget.remove();
            }
            this._visWidget = new viewInfo.view({
                el: this.$('.c-run-container'),
                model: visModel
            });
            this._visWidget.render();

            this.$('.c-side-panel-title').text(title).attr('title', title);
            this.$('.c-side-panel').removeClass('hide');
            this.$('.c-workbench-body-container').removeClass('empty');
            this.$('.c-control-modal').hide().tooltip({
                container: 'body',
                placement: 'bottom'
            });
            this.$('.c-control-panel').addClass('hide');

            var state = 'active';
            _.each(viewInfo.opts.controls, function (control) {
                this.$('a.c-'+control.key+'-mode').show().attr('state', state);
                if (state === 'active') {
                    this.controlMode = control.key;
                    this.$('.c-'+control.key+'-panel').removeClass('hide');
                }
                state = 'inactive';
            }, this);
        }, this).fetch();
    }
});
