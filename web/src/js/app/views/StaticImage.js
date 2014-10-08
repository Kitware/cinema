(function () {
    // Create Composite data type view assembly

    cinema.viewFactory.registerView('parametric-image-stack', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            fakeToolbarRootView = {
                update: function(root) {
                    this.$el = $('.c-view-panel', root);
                },
                '$el': $('.c-view-panel', container)
            },
            dataType = model.getDataType(),
            controlModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel }),
            renderer = new cinema.views.StaticImageVisualizationCanvasWidget({
                el: container,
                model: model,
                controlModel: controlModel,
                viewpoint: viewpointModel
            }),
            mouseInteractor = new cinema.utilities.RenderViewMouseInteractor({
                renderView: renderer,
                camera: viewpointModel
            }).enableMouseWheelZoom({
                maxZoomLevel: 10,
                zoomIncrement: 0.05,
                invertControl: false
            }).enableDragPan({
                keyModifiers: cinema.keyModifiers.SHIFT
            }).enableDragRotation({
                keyModifiers: null
            }),
            controlTools = new cinema.views.ToolsWidget({
                el: $('.c-tools-panel'),
                model: model,
                controlModel: controlModel,
                viewport: renderer,
                toolbarSelector: '.c-panel-toolbar',
                toolbarRootView: fakeToolbarRootView
            }),
            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

            function render () {
                var root = $(rootSelector);
                fakeToolbarRootView.update(root);
                renderer.setElement(root).render();
                controlTools.setElement($('.c-tools-panel')).render();
                refreshCamera(true);
            }

            function refreshCamera () {
                renderer.showViewpoint();
            }

            function resetCamera () {
                renderer.resetCamera();
            }

            controlModel.on('change', refreshCamera);
            viewpointModel.on('change', refreshCamera);
            cinema.events.on('c:resetCamera', resetCamera);

            render();

        return {
            controlList: controlList,
            render: render
        };
    });
}());
