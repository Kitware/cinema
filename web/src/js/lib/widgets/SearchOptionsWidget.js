cinema.views.SearchOptionsWidget = Backbone.View.extend({
    events: {
        'change input': function (e) {
            var el = $(e.target),
                option = el.closest('.c-options-option').attr('option_id'),
                value = el.val();
            this.updateIndex(option, value);
        },

        'mousemove input': function (e) {
            var el = $(e.target),
                option = el.closest('.c-options-option').attr('option_id'),
                value = el.val();
            this.updateIndex(option, value);
        },

        'click .c-options-option-button': function (e) {
            var el = $(e.target),
                option = el.closest('.c-options-option').attr('option_id'),
                action = el.attr('action');
            this[action](option);
        }
    },

    initialize: function (settings) {
        this.zoomLevel = 0.25;
        this.zoomWidth = $(window).width() * this.zoomLevel;

        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarRootView = settings.toolbarRootView || this;
        this.toolbarView = new cinema.views.ToolsToolbar({el: $(this.toolbarSelector, this.toolbarRootView) });

        this._annotateOptions();
    },

    _formatLabel: function (val) {
        return Number(val).toFixed(2);
    },

    _annotateOptions: function () {
        this.optionMap = {
            zoom: {
                icon: 'icon-zoom-in',
                iconlabel: 'nbsp',
                label: '0.25',
                type: 'range',
                value: 25,
                min: 1,
                max: 100,
                step: 1
            }
        };

        this.options = ['zoom'];
    },

    render: function () {
        this.$el.html(cinema.templates.searchOptions({
            optionMap: this.optionMap,
            options: this.options
        }));
        this.toolbarView.setElement($(this.toolbarSelector, this.toolbarRootView.$el)).render();
    },

    _refresh: function () {
        this.options.forEach(function (optionName) {
            var group = this.$('.c-options-option[option_id="' + optionName + '"]'),
                label = Number(this.optionMap[optionName].value)/100.0,
                idx = this.optionMap[optionName].value;
            group.find('label.value').text(
                this._formatLabel(label)
            );
            group.find('input').val(idx);
        }.bind(this));
    },

    updateIndex: function (optionName, index) {
        if (optionName === 'zoom') {
            if (index !== this.optionMap[optionName].value) {
                this.optionMap[optionName].value = index;
                this.zoomLevel = Number(this.optionMap[optionName].value) / 100.0;
                this.zoomWidth = $(window).width() * this.zoomLevel;
                this._refresh();
                cinema.events.trigger('c:handlesearchzoom', {zoomWidth: this.zoomWidth});
            }
        }
    },

    next: function (optionName) {
        if (optionName === 'zoom') {
            if (this.optionMap[optionName].value === this.optionMap[optionName].max) {
                return;
            }
            else {
                this.optionMap[optionName].value = Number(this.optionMap[optionName].value) + 1;
                this.zoomLevel = this.optionMap['zoom'].value / 100.0;
                this.zoomWidth = $(window).width() * this.zoomLevel;
                this._refresh();
                cinema.events.trigger('c:handlesearchzoom', {zoomWidth: this.zoomWidth});
            }
        }
    },

    previous: function (optionName) {
        if (optionName === 'zoom') {
            if (this.optionMap[optionName].value === this.optionMap[optionName].min) {
                return;
            }
            else {
                this.optionMap[optionName].value -= 1;
                this.zoomLevel = Number(this.optionMap[optionName].value) / 100.0;
                this.zoomWidth = $(window).width() * this.zoomLevel;
                this._refresh();
                cinema.events.trigger('c:handlesearchzoom', {zoomWidth: this.zoomWidth});
            }
        }
    },

    last: function (optionName) {
        if (optionName === 'zoom') {
            this.optionMap[optionName].value = this.optionMap[optionName].max;
            this.zoomLevel = Number(this.optionMap[optionName].value) / 100.0;
            this.zoomWidth = $(window).width() * this.zoomLevel;
            this._refresh();
            cinema.events.trigger('c:handlesearchzoom', {zoomWidth: this.zoomWidth});
        }
    },

    first: function (optionName) {
        if (optionName === 'zoom') {
            this.optionMap[optionName].value = this.optionMap[optionName].min;
            this.zoomLevel = Number(this.optionMap[optionName].value) / 100.0;
            this.zoomWidth = $(window).width() * this.zoomLevel;
            cinema.events.trigger('c:handlesearchzoom', {zoomWidth: this.zoomWidth});
            this._refresh();
        }
    },

    getZoomWidth: function() {
        return this.zoomWidth;
    }
});