define(['jquery', 'underscore', 'util/events'], function ($, _, events) {

    var DEFAULT_DATA = {
        view: 'area',
        search: '',
        author: '',
        rt: false,
        min_rt: 0,
        sentiment: ''
    };

    var VALID_VIEW_MODES = ['area', 'stacked', 'expand', 'hidden'];

    var VALID_SENTIMENTS = ['', 'negative', 'neutral', 'positive'];

    /**
     * A class for managing query settings, updating a set
     * of query controls, and updating the URL.
     *
     * @param ui
     * @param data
     * @constructor
     */
    var Query = function (ui, data) {
        data = data || {};
        this.data = _.defaults(data, DEFAULT_DATA);

        this._initUI(ui);
        this._fillForm();

        this._initEvents();
    };

    //Add 'on' and 'trigger'
    events(Query);

    /**
     * Find several important UI elements.
     *
     * @param form
     * @private
     */
    Query.prototype._initUI = function (form) {
        this.ui = {};

        this.ui.form = form;

        this.ui.view_buttons = form.find('.view-buttons');
        this.ui.search_input = form.find('.query-search');
        this.ui.author_input = form.find('.query-author');
        this.ui.rt_checkbox = form.find('.query-rt');
        this.ui.min_rt_input = form.find('.query-minrt');
        this.ui.sentiment_select = form.find('.query-sentiment');
        this.ui.update_button = form.find('.query-update');
    };

    /**
     * Set up handlers for UI events.
     *
     * @private
     */
    Query.prototype._initEvents = function () {
        this.ui.update_button.on('click', $.proxy(this._updateClicked, this));
        this.ui.view_buttons.on('click', $.proxy(this._viewButtonClicked, this));
        this.ui.form.on('submit', $.proxy(this._formSubmitted, this));
    };

    /**
     * Called when the update button is clicked for this query.
     *
     * @private
     */
    Query.prototype._updateClicked = function () {
        if (this.collectData()) {
            this.trigger('update', this);
        }
    };

    /**
     * Called when a view control button is clicked.
     *
     * @private
     */
    Query.prototype._viewButtonClicked = function () {
        this.trigger('view-change', this);
    };

    /**
     * Called when the form is submitted (probably user pressed enter).
     *
     * @private
     */
    Query.prototype._formSubmitted = function (e) {
        e.preventDefault();
        this._updateClicked();
        return false;
    };

    /**
     * Gather user input from the query controls.
     */
    Query.prototype.collectData = function () {

        //Get the mode of the active mode button (validate)
        var mode = this.ui.view_buttons.find('.active').data('mode');
        if (VALID_VIEW_MODES.indexOf(mode) < 0) {
            this.invalid = 'Invalid view mode. How did this happen!';
            return false;
        }
        //It was in the list of valid modes
        this.data.view = mode;

        //Get the search string
        this.data.search = $.trim(this.ui.search_input.val());

        //Get the author string
        this.data.author = $.trim(this.ui.author_input.val());

        //Get whether or not to show retweets
        this.data.rt = this.ui.rt_checkbox.is(':checked');

        //Get the minimum RT count (validate first)
        var num = Number(this.ui.min_rt_input.val());
        if (isNaN(num) || num < 0) {
            this.invalid = 'Not a valid minimum retweet count';
            return false;
        }
        //Guess it was ok
        this.data.min_rt = num;

        //Get the selected sentiment filter, with validation
        var sentiment = this.ui.sentiment_select.val();
        if (VALID_SENTIMENTS.indexOf(sentiment) < 0) {
            this.invalid = 'Invalid sentiment. How did this happen!';
            return false;
        }
        this.data.sentiment = sentiment;

        return true;
    };

    /**
     * Place stored data into the query controls.
     *
     * @private
     */
    Query.prototype._fillForm = function () {
        //Activate the proper mode button
        this.ui.view_buttons.children().removeClass('active');
        this.ui.view_buttons
            .find('[data-mode=' + this.data.view + ']')
            .addClass('active');

        //Set the search string
        this.ui.search_input.val(this.data.search);

        //Set the author string
        this.ui.author_input.val(this.data.author);

        //Set the retweets checkbox
        this.ui.rt_checkbox.prop('checked', this.data.rt);

        //Set the min retweets filter
        this.ui.min_rt_input.val(this.data.min_rt);

        this.ui.sentiment_select.val(this.data.sentiment);
    };

    return Query;
});