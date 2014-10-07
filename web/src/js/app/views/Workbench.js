(function () {
    cinema.viewFactory.registerView('workbench', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            configuration = {
                // 1x1, 2x2, 2x3, 1x3
                layout: { rows: 1, cols: 1 },
                active: 0,
                template: 'workbenchGridLayout',
                models: {}
            };

        var renderWhenReady = function () {
            var ready = _.every(configuration.models, function (model) {
                return model.loaded();
            });
            if (ready) {
                render();
            }
        };

        // Load internal models
        _.each(model.get('runs'), function (run) {
            var internalModel = new cinema.models.VisualizationModel({
                basePath: model.get('basePath') + '/' + run.path,
                infoFile: 'info.json'
            });
            configuration.models[run.path] = internalModel;
            internalModel.fetch();
        });

        var render = function () {
            var root = $(rootSelector);

            // Apply current layout inside model
            $('.c-body-container', root).html(cinema.templates[configuration.template]({
                layout: configuration.layout
            }));

            // TODO we need to fix all this at some point, it's the wrong way
            // to do this.
            $('.header-right .c-wb-layout', root).off().on('click', function (e) {
                var me = $(e.target),
                    rows = Number(me.attr('data-rows')),
                    cols = Number(me.attr('data-cols')),
                    templateName = me.attr('data-template');
                if (templateName) {
                    configuration.layout = { rows: rows, cols: cols };
                    configuration.active = 0;
                    configuration.template = templateName;
                    render();
                }
            });

            $('.header-right .c-vis-option', root).off().on('click', function (e) {
                var path = $(e.currentTarget).attr('path');

                _.each($('.c-dv-layout-item'), function (el) {
                    new cinema.views.WorkbenchElementWidget({
                        el: el,
                        model: configuration.models[path]
                    }).render();
                });
            });
        };

        return {
            controlList: [],
            render: render
        };
    });
}());
