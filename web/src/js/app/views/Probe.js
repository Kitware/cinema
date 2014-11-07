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
                { position: 'left', key: 'rendering', icon: 'icon-picture', title: 'Rendering' },
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ],
            controlModel = new cinema.decorators.Control(model),
            probeModel = new cinema.decorators.Probe(controlModel),
            renderingModel = new cinema.models.RenderingModel({
               url: '/rendering/rendering.json',
               ranges: probeModel.get('ranges'),
               fields: probeModel.get('fields') }),
            renderer = new cinema.views.ProbeRendererWidget({ model: probeModel , renderingModel: renderingModel}),
            controlView = new cinema.views.ControlWidget({ model: probeModel, controlModel: probeModel}),
            tools = new cinema.views.ProbeRendererControlWidget({ model: probeModel, controlView: controlView});
            renderingView = new cinema.views.RenderingWidget({
                el: $('.c-rendering-panel', container),
                model: probeModel,
                viewport: renderer,
                renderingModel: renderingModel,
                toolbarSelector: '.c-panel-toolbar',
                disabledList: [ 'c-edit-lighting', 'c-view-fps-info']
            });

        function render () {
            var root = $(rootSelector);
            renderer.setElement($('.c-body-container', root)).render();
            tools.setElement($('.c-tools-panel', root)).render();
            renderingView.setElement($('.c-rendering-panel', root)).render();

            $('.c-tools-panel', root).toggle(visibility('tools'));
            $('.c-rendering-panel', root).toggle(visibility('rendering'));
        }

        return {
            controlList: controlList,
            render: render
        };
    });

}());
