(function () {
    cinema.viewFactory.registerView('workbench', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector);

        // Add attributes for workbench usage
        model.set({
            workbench: {
                // 2x2, 2x3, 1x3
                layout: { rows: 2, cols: 2 },
                active: 0,
                template: 'workbenchGridLayout'
            }
        });

        function render () {
            var root = $(rootSelector);
            $('.c-body-container', root).html(cinema.templates[model.get('workbench').template]({
                layout: model.get('workbench').layout
            }));
            $('.c-wb-layout', root).off().on('click', function () {
                var me = $(this),
                    rows = Number(me.attr('data-rows')),
                    cols = Number(me.attr('data-cols')),
                    templateName = me.attr('data-template');
                model.get('workbench').layout = { rows:rows, cols:cols };
                model.get('workbench').active = 0;
                model.get('workbench').template = templateName;
                model.trigger('change');
            });
        }

        model.on('change', render);

        render();

        return {
            controls: [],
            render: render
        };
    });
}());
