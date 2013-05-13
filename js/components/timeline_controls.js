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

        this.ui.view_button_group = this.into.find('.mode-switch-button-group');
        this.ui.view_button_label = this.ui.view_button_group.find('.dropdown-label');
        this.ui.view_buttons = this.ui.view_button_group.find('.select');
        this.ui.view_button_menu = this.ui.view_button_group.find('.dropdown-menu');

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
            self.ui.view_button_menu.dropdown('toggle');
            return false;
        });
        this.ui.annotations_toggle.on('change', $.proxy(this._annotationToggled, this));
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

        this.ui.view_button_label.text(clicked.text());
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

        var selector = '[data-mode=' + this.model.mode() + '][data-focus=' + focus + ']';

        var clicked = this.ui.view_buttons.filter(selector);
        this._updateViewButton(clicked);

        this.ui.annotations_toggle.prop('checked', this.model.annotations());
    };

    return TimelineControls;
});