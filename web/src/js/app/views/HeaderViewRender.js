cinema.views.HeaderViewRender = cinema.views.HeaderView.extend({
    events: {
        'click .c-rh-visibility-button': function (e) {
            var origin = $(e.target),
                containerSelector = origin.attr('container-class');
            $('.' + containerSelector).fadeIn();
        }
    },

    initialize: function () {
        this._template = cinema.app.templates.renderHeader;
        this.listenTo(cinema.viewFactory, 'change', this.render);
    },

    render: function () {
        this.$el.html(this._template({
            controlPanels: cinema.viewFactory.getControls('RenderView')
        }));

        this.$('a[title]').tooltip({
            placement: 'auto',
            delay: {show: 200}
        });
    }
});
