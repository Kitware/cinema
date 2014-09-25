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
            fieldsModel = new cinema.models.FieldModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ fields: fieldsModel }),
            renderer = new cinema.views.StaticImageVisualizationCanvasWidget({
                el: $('.c-body-container', container),
                model: model,
                fields: fieldsModel,
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
            controlPanel = new cinema.views.FieldsControlWidget({
                el: $('.c-control-panel-body', container),
                model: model,
                fields: fieldsModel,
                viewport: renderer,
                toolbarSelector: '.c-panel-toolbar',
                toolbarRootView: fakeToolbarRootView
            }),
            controlList = [
                { position: 'right', key: 'view', icon: 'icon-camera', title: 'View' }
            ];

            function render () {
                var root = $(rootSelector);
                fakeToolbarRootView.update(root);
                renderer.setElement($('.c-body-container', root)).render();
                controlPanel.setElement($('.c-control-panel-body', root)).render();
                refreshCamera(true);
            }

            function refreshCamera () {
                renderer.showViewpoint();
            }

            function resetCamera () {
                renderer.resetCamera();
            }

            fieldsModel.on('change', refreshCamera);
            viewpointModel.on('change', refreshCamera);
            cinema.events.on('c:resetCamera', resetCamera);

            render();

        return {
            controls: controlList,
            render: render
        };
    });
}());
