(function () {
    var sharedDataMap = {},
        visibilityMap = { 'rendering': false, 'tools': false };

    function visibility(name, value) {
        if(value === undefined) {
            return visibilityMap[name];
        } else {
            visibilityMap[name] = value;
        }
    }

    cinema.events.on('toggle-control-panel', function(event) {
        visibility(event.key, event.visible);
    });

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('probe-slice', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' },
                { position: 'left', key: 'rendering', icon: 'icon-sun', title: 'Rendering' }
            ],
            probeModel = new cinema.decorators.Probe(model),
            renderer = new cinema.views.ProbeRendererWidget({ model: probeModel }),
            tools = new cinema.views.ProbeRendererControlWidget({ model: probeModel });

        function render () {
            var root = $(rootSelector);
            renderer.setElement($('.c-body-container', root)).render();
            tools.setElement($('.c-tools-panel', root)).render();

            $('.c-tools-panel', root).toggle(visibility('tools'));
            $('.c-rendering-panel', root).toggle(visibility('rendering'));
        }

        return {
            controlList: controlList,
            render: render
        };
    });

}());
