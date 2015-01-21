cinema.views.ControlWidget = Backbone.View.extend({
    events: {
        'change input': function (e) {
            var el = $(e.target),
                control = el.closest('.c-controls-control').attr('control_id'),
                value = el.val();
            this.updateIndex(control, value);
        },

        'mousemove input': function (e) {
            var el = $(e.target),
                control = el.closest('.c-controls-control').attr('control_id'),
                value = el.val();
            this.updateIndex(control, value);
        },

        'change select': function (e) {
            var el = $(e.target),
                control = el.closest('.c-controls-control').attr('control_id'),
                value = el.val();
            this.updateValue(control, value);
        },

        'click .c-controls-control-button': function (e) {
            var el = $(e.target),
                control = el.closest('.c-controls-control').attr('control_id'),
                action = el.attr('action');
            this[action](control);
        }
    },

    initialize: function (settings) {
        this.model = settings.model;
        this.exclude = settings.exclude || [];

        if(this.model.has("control")) {
            this.order = this.model.get("control").order;
        } else {
            this.order = [];
            var that = this;

            // Create an ordered list of controls
            _.each(this.model.get("arguments"), function (value, key, list) {
                that.order.push(key);
            });

            // FIXME should reorder that list at some point
        }
        this.order = _.difference(this.order, this.exclude);

        this.controlModel = settings.controlModel;
        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarRootView = settings.toolbarRootView || this;
        this.toolbarView = new cinema.views.ToolsToolbar({el: $(this.toolbarSelector, this.toolbarRootView) });

        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.controlModel, 'change', this._refresh);
    },

    _formatLabel: function (val) {
        return Number(val).toFixed();
    },

    _annotateControl: function (controlMap) {
        var newControlMapWithIcons = _.extend({}, controlMap),
            iconMap = {
                phi: 'icon-resize-horizontal',
                theta: 'icon-resize-vertical',
                time: 'icon-clock',
                contourIdx: 'icon-layers'
            },
            iconLabelMap = {
                phi: 'Phi',
                theta: 'Theta',
                time: 'Tau'
            };

        _.each(newControlMapWithIcons, function (value, key, list) {
            if (_.has(iconMap, key)) {
                newControlMapWithIcons[key].icon = iconMap[key];
                if (_.has(iconLabelMap, key)) {
                    newControlMapWithIcons[key].iconlabel = iconLabelMap[key];
                } else {
                    newControlMapWithIcons[key].iconlabel = 'nbsp';
                }
            }
        });

        return newControlMapWithIcons;
    },

    render: function () {
        this.$el.html(cinema.templates.control({
            controlMap: this._annotateControl(this.controlModel.getControlMap()),
            order: this.order
        }));
        this.toolbarView.setElement($(this.toolbarSelector, this.toolbarRootView.$el)).render();
    },

    _refresh: function () {
        this.order.forEach(function (controlName) {
            var group = this.$('.c-controls-control[control_id="' + controlName + '"]'),
                value = this.controlModel.getControl(controlName),
                idx = this.controlModel.getControlIndex(controlName),
                type = this.controlModel.getControlType(controlName);

            group.find('label.value').text(
                this._formatLabel(value)
            );
            if (type === "range") {
                group.find('input').val(idx);
            } else if (type === "list") {
                group.find('select').val(value);
            }

        }.bind(this));
    },

    updateIndex: function (controlName, index) {
        if (this.controlModel.setControlIndex(controlName, index)) {
            this._refresh();
        }
    },

    updateValue: function (controlName, value) {
        if (this.controlModel.setControl(controlName, value)) {
            this._refresh();
        }
    },

    next: function (controlName) {
        this.controlModel.incrementControlValue(controlName);
        this._refresh();
    },

    previous: function (controlName) {
        this.controlModel.decrementControlValue(controlName);
        this._refresh();
    },

    last: function (controlName) {
        this.controlModel.setLastControlValue(controlName);
        this._refresh();
    },

    first: function (controlName) {
        this.controlModel.setFirstControlValue(controlName);
        this._refresh();
    },

    play: function (controlName) {
        this.controlModel.startPlay(controlName);
        this._refresh();
    }
});
