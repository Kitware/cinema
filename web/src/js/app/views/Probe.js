(function () {
    var sharedDataMap = {},
        visibilityMap = { 'rendering': false, 'tools': false };

    var getSharedData = function (model, container, analysis) {
        var key = model.getHash() + '::' + ($(container).attr('container-uid') || 'main');
        if (_.has(sharedDataMap, key)) {
            return sharedDataMap[key];
        } else {
            var probe = new cinema.decorators.Probe(new cinema.decorators.Control(model)),
                rendering = new cinema.models.RenderingModel({
                    url: cinema.staticRoot + 'rendering/rendering.json',
                    ranges: probe.get('ranges'),
                    fields: probe.get('fields')
                }),
                renderer = new cinema.views.ProbeRendererWidget({
                    model: probe,
                    renderingModel: rendering
                }),
                controlView = new cinema.views.ControlWidget({
                    model: probe,
                    controlModel: probe
                }),
                tools = new cinema.views.ProbeRendererControlWidget({
                    model: probe,
                    controlView: controlView
                }),
                renderingView = new cinema.views.RenderingWidget({
                    el: this.$('.c-rendering-panel', container),
                    model: probe,
                    viewport: renderer,
                    renderingModel: rendering,
                    disabledList: [ 'c-edit-lighting', 'c-view-fps-info' ],
                    toolbarSelector: '.c-panel-toolbar'
                });

            var shared = {
                key: key,
                rendering: rendering,
                renderer: renderer,
                controlView: controlView,
                tools: tools,
                renderingView: renderingView,
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

    cinema.views.ProbeView = Backbone.View.extend({
        initialize: function(opts) {
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            var sharedData = getSharedData(this.model, this.$el, this._hasAnalysis);
            this.key = sharedData.key;

            this.renderer = sharedData.renderer;
            this.tools = sharedData.tools;
            this.renderingView = sharedData.renderingView;
        },

        render: function() {
            this.renderer.setElement(this.$('.c-body-container')).render();
            this.tools.setElement(this.$('.c-tools-panel')).render();
            this.renderingView.setElement(this.$('.c-rendering-panel')).render();
        },

        remove: function() {

            // Free factory
            freeSharedDataMap(this.key);

            this.key = null;

            // Trash views
            this.renderer.remove();
            this.tools.remove();
            this.renderingView.remove();
        }
    });

    cinema.views.ProbeSearchView = Backbone.View.extend({
        initialize: function (opts) {
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            var sharedData = getSharedData(this.model, this.$el, this._hasAnalysis);
            this.key = sharedData.key;
        },

        render: function () {
            return this;
        },

        remove: function () {
            getSharedData(this.model, this.$el, this._hasAnalysis).remove();

            // SharedData
            freeSharedDataMap(this.key);

            // Connections to SharedData
            this.key = null;
        }
    });

    cinema.viewMapper.registerView('probe-slice', 'view', cinema.views.ProbeView, {
        controls: [
            { position: 'left', key: 'rendering', icon: 'icon-picture', title: 'Rendering' },
            { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
        ]
    });

    cinema.viewMapper.registerView('probe-slice', 'search', cinema.views.ProbeSearchView, {
        controls: [
            //{ position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
            //{ position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
        ]
    });

}());
