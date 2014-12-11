(function () {
    var sharedDataMap = {},
        visibilityMap = { 'histogram': false, 'information': false };

    var getSharedData = function (model, container, analysis) {
        var key = model.getHash() + '::' + ($(container).attr('container-uid') || 'main');
        if (_.has(sharedDataMap, key)) {
            return sharedDataMap[key];
        } else {
            var control = new cinema.models.ControlModel({
                    info: model
                }),
                viewpoint = new cinema.models.ViewPointModel({
                    controlModel: control
                }),
                renderView = new cinema.views.StaticImageVisualizationCanvasWidget({
                    el: $('.c-body-container', container),
                    model: model,
                    controlModel: control,
                    viewpoint: viewpoint
                }),
                toolsWidget = new cinema.views.ToolsWidget({
                    el: $('.c-tools-panel', container),
                    model: model,
                    controlModel: control,
                    viewport: renderView,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                histogram = null,
                informationWidget = null,
                histogramWidget = null,
                searchView = null,
                metaDataSearchView = null,
                metaDataInformationWidget = null;

            var shared = {
                key: key,
                control: control,
                histogram: histogram,
                viewpoint: viewpoint,
                informationWidget: informationWidget,
                renderView: renderView,
                histogramWidget: histogramWidget,
                toolsWidget: toolsWidget,
                remove: function () {
                }
            };
            sharedDataMap[key] = shared;
            return shared;
        }
    };

    var freeSharedDataMap = function (key) {
        delete sharedDataMap[key];
    };

    var visibility = function (name, value) {
        if (value === undefined) {
            return visibilityMap[name];
        } else {
            visibilityMap[name] = value;
        }
    };

    cinema.events.on('toggle-control-panel', function(event) {
        visibility(event.key, event.visible);
    });

    cinema.views.StaticImageView = Backbone.View.extend({
        initialize: function (opts) {
            var sharedData = getSharedData(this.model, this.$el, false);
            this.key = sharedData.key;

            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.renderView = sharedData.renderView;
            this.toolsWidget = sharedData.toolsWidget;

            new cinema.utilities.RenderViewMouseInteractor({
                renderView: this.renderView,
                camera: this.viewpointModel
            }).enableMouseWheelZoom({
                    maxZoomLevel: 10,
                    zoomIncrement: 0.05,
                    invertControl: false
                }).enableDragPan({
                    keyModifiers: cinema.keyModifiers.SHIFT
                }).enableDragRotation({
                    keyModifiers: null
                });

            this.listenTo(this.controlModel, 'change', this.refreshCamera);
            this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            this.renderView.setElement(this.$('.c-body-container')).render().showViewpoint(true);
            this.toolsWidget.setElement(this.$('.c-tools-panel')).render();
            this.$('.c-information-panel').toggle(visibility('information'));
            return this;
        },

        refreshCamera: function () {
            if (this.renderView) {
                this.renderView.showViewpoint();
            }
        },

        resetCamera: function () {
            if (this.renderView) {
                this.renderView.resetCamera();
            }
        },

        remove: function () {
            getSharedData(this.model, this.$el, false).remove();

            // SharedData
            freeSharedDataMap(this.key);

            // Connections to SharedData
            this.key = null;

            // Models
            this.controlModel.remove();
            this.viewpointModel.remove();

            // Views
            this.renderView.remove();
            this.compositeTools.remove();
        }
    });

    cinema.viewMapper.registerView('parametric-image-stack', 'view', cinema.views.StaticImageView, {
        controls: [
            { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
            { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
        ]
    });

}());
