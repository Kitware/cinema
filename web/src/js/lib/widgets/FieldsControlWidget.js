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
        this.order = this.model.get("control").order;
        this.fields = settings.fields;

        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.fields, 'change', this._refresh);
    },

    _formatLabel: function (val) {
        return Number(val).toFixed();
    },

    _annotateFields: function (fieldsMap) {
        var newFieldMapWithIcones = _.extend({}, fieldsMap),
            iconMap = {
                phi: 'icon-resize-horizontal',
                theta: 'icon-resize-vertical',
                time: 'icon-clock',
                contourIdx: 'icon-layers'
            };

        for (var key in newFieldMapWithIcones) {
            if (_.has(iconMap, key)) {
                newFieldMapWithIcones[key].icon = iconMap[key];
            }
        }
        return newFieldMapWithIcones;
    },

    render: function () {
        this.$el.html(cinema.templates.fieldsControl({
            fields: this._annotateFields(this.fields.getFieldsMap()),
            order: this.order
        }));
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
