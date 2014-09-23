cinema.views.FieldsControlWidget = Backbone.View.extend({
    events: {
        'change input': function (e) {
            var el = $(e.target),
                field = el.closest('.c-field-control').attr('field_id'),
                value = el.val();
            this.updateIndex(field, value);
        },

        'mousemove input': function (e) {
            var el = $(e.target),
                field = el.closest('.c-field-control').attr('field_id'),
                value = el.val();
            this.updateIndex(field, value);
        },

        'change select': function (e) {
            var el = $(e.target),
                field = el.closest('.c-field-control').attr('field_id'),
                value = el.val();
            this.updateValue(field, value);
        },

        'click .c-field-control-button': function (e) {
            var el = $(e.target),
                field = el.closest('.c-field-control').attr('field_id'),
                action = el.attr('action');
            this[action](field);
        }
    },

    initialize: function (settings) {
        if (!settings.viewport) {
            throw "Animation widget requires a viewport.";
        }
        this.model = settings.model;
        this.exclude = settings.exclude || [];

        if(this.model.has("control")) {
            this.order = this.model.get("control").order;
        } else {
            this.order = [];
            var that = this;

            // Create an ordered list of fields
            _.each(this.model.get("arguments"), function (value, key, list) {
                that.order.push(key);
            });

            // FIXME should reorder that list at some point
        }
        this.order = _.difference(this.order, this.exclude);

        this.fields = settings.fields;
        this.toolbarView = new cinema.views.ViewControlToolbar({el: settings.toolbarContainer});

        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.fields, 'change', this._refresh);
    },

    _formatLabel: function (val) {
        return Number(val).toFixed();
    },

    _annotateFields: function (fieldsMap) {
        var newFieldMapWithIcons = _.extend({}, fieldsMap),
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

        _.each(newFieldMapWithIcons, function (value, key, list) {
            if (_.has(iconMap, key)) {
                newFieldMapWithIcons[key].icon = iconMap[key];
                if (_.has(iconLabelMap, key)) {
                    newFieldMapWithIcons[key].iconlabel = iconLabelMap[key];
                } else {
                    newFieldMapWithIcons[key].iconlabel = 'nbsp';
                }
            }
        });

        return newFieldMapWithIcons;
    },

    render: function () {
        this.$el.html(cinema.templates.fieldsControl({
            fields: this._annotateFields(this.fields.getFieldsMap()),
            order: this.order
        }));
        this.toolbarView.render();
    },

    _refresh: function () {
        this.order.forEach(function (fieldName) {
            var group = this.$('.c-field-control[field_id="' + fieldName + '"]'),
                value = this.fields.getField(fieldName),
                idx = this.fields.getFieldIndex(fieldName),
                type = this.fields.getFieldType(fieldName);

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

    updateIndex: function (fieldName, index) {
        if (this.fields.setFieldIndex(fieldName, index)) {
            this._refresh();
        }
    },

    updateValue: function (fieldName, value) {
        if (this.fields.setField(fieldName, value)) {
            this._refresh();
        }
    },

    next: function (fieldName) {
        this.fields.getNextField(fieldName);
        this._refresh();
    },

    previous: function (fieldName) {
        this.fields.getPreviousField(fieldName);
        this._refresh();
    },

    last: function (fieldName) {
        this.fields.getLastField(fieldName);
        this._refresh();
    },

    first: function (fieldName) {
        this.fields.getFirstField(fieldName);
        this._refresh();
    }
});
