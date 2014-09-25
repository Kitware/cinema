(function () {
    cinema.viewFactory.registerView('workbench', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            configuration = {
                // 1x1, 2x2, 2x3, 1x3
                layout: { rows: 1, cols: 1 },
                active: 0,
                template: 'workbenchGridLayout',
                models: []
            };


        // Load internal models
        _.each(model.get('runs'), function(run) {
            var internalModel = new cinema.models.VisualizationModel({
                basePath: model.get('basePath') + '/' + run.path,
                infoFile: 'info.json'
            });
            internalModel.on('change', renderWhenReady);
            configuration.models.push(internalModel);
            internalModel.fetch();
        });

        function renderWhenReady () {
            var notReady = false;
            _.each(configuration.models, function(m) {
                if (!m.loaded()) {
                    notReady = true;
                }
            });
            if(!notReady) {
                render();
            }
        }

        function render () {
            var root = $(rootSelector);

            // Apply current layout inside model
            $('.c-body-container', root).html(cinema.templates[configuration.template]({
                layout: configuration.layout
            }));

            // Handle layout pattern change
            $('.header-right', root).off().on('click .c-wb-layout', function (e) {
                var me = $(e.target),
                    rows = Number(me.attr('data-rows')),
                    cols = Number(me.attr('data-cols')),
                    templateName = me.attr('data-template');
                if(templateName) {
                    configuration.layout = { rows:rows, cols:cols };
                    configuration.active = 0;
                    configuration.template = templateName;
                    render();
                }
            });

            // Bind views inside each workbench item
            _.each(configuration.models, function(viewModel, index) {
                var containerSelector = '.c-dv-layout-item-container[item-index="'+index+'"]',
                    internalContainer = $(containerSelector, root);
                if(viewModel.loaded() && internalContainer.length === 1) {
                    cinema.viewFactory.render(containerSelector, 'view', viewModel);
                }
            });
        }

        return {
            controls: [],
            render: render
        };
    });
}());
