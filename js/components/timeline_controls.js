define(['jquery', 'underscore', 'util/events', 'model/display'], function ($, _, events, Display) {

    /**
     * A class for managing the controls that manipulate the timeline display.
     *
     * The options parameter may have an object with 'model' (a Display) and 'into' (a selection)
     *
     * A new Display will be initialized if model is not set.
     *
     * If into is not set, a new element will be created for the controls.
     *
     * @param options
     * @constructor
     */
    var TimelineControls = function (options) {

        this.api = options.api;

        this.queries = options.queries;

        this.model = options.model || new Display();
        this.into = options.into || $('<div>');

        this._initUI();
        this._fillForm();

        this._initEvents();
    };

    //Add 'on' and 'trigger'
    events(TimelineControls);

    /**
     * Find several important UI elements.
     *
     * @private
     */
    TimelineControls.prototype._initUI = function () {
        this.ui = {};

        this.ui.view_button_group = this.into.find('.mode-switch-buttons');
        this.ui.view_buttons = this.ui.view_button_group.find('li');

        this.ui.annotations_toggle = this.into.find('.annotations-toggle');
    };

    /**
     * Set up handlers for UI events.
     *
     * @private
     */
    TimelineControls.prototype._initEvents = function () {
        var self = this;
        this.ui.view_buttons.on('click', function(e) {
            e.preventDefault();
            self._viewButtonClicked($(this));
            return false;
        });
        this.ui.view_buttons.on('mouseenter', function(e) {
            var focus = $(this).data('focus');
            if (focus) {
                self.api.trigger('brush', [{
                    type: 'query',
                    id: self.queries[focus - 1].id()
                }]);
            }
        });
        this.ui.view_buttons.on('mouseleave', function(e) {
            var focus = $(this).data('focus');
            if (focus) {
                self.api.trigger('unbrush', [{
                    type: 'query',
                    id: self.queries[focus - 1].id()
                }]);
            }
        });

        this.ui.annotations_toggle.on('change', $.proxy(this._annotationToggled, this));

        this.model.on('change', $.proxy(this._fillForm, this));
    };

    /**
     * Called when a view control button is clicked.
     *
     * @private
     */
    TimelineControls.prototype._viewButtonClicked = function (clicked) {

        //Get the mode of the active mode button
        var mode = clicked.data('mode');
        var focus = clicked.data('focus');

        if (focus) {
            //Convert back into proper focus values
            focus = focus - 1;
        }

        //Save on the model
        this.model.set({
            mode: mode,
            focus: focus
        });

        this._updateViewButton(clicked);
    };

    /**
     * Update a clicked view button.
     * @param clicked
     * @private
     */
    TimelineControls.prototype._updateViewButton = function(clicked) {
        this.ui.view_buttons.removeClass('active');
        clicked.addClass('active');
    };

    /**
     * Called when the annotation toggle-button is clicked.
     *
     * @private
     */
    TimelineControls.prototype._annotationToggled = function() {
        var annotations = this.ui.annotations_toggle.is(':checked');

        this.model.annotations(annotations);
    };

    /**
     * Place stored data into the query controls.
     *
     * @private
     */
    TimelineControls.prototype._fillForm = function () {
        //Activate the proper mode button
        var focus = this.model.focus();

        //If focus is null, make it an empty string
        focus = focus === null ? '' : focus;

        //Adjust the focus by one - we don't use 0 in the html
        if (focus !== '') {
            focus = focus + 1;
        }

        var selector = '[data-mode=' + this.model.mode() + '][data-focus=' + focus + ']';

        var clicked = this.ui.view_buttons.filter(selector);
        this._updateViewButton(clicked);

        this.ui.annotations_toggle.prop('checked', this.model.annotations());
    };

    return TimelineControls;
});