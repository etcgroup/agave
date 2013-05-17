define(['jquery', 'underscore', 'util/events', 'model/query'], function ($, _, events, Query) {

    /**
     * A class for managing the controls that manipulat a query object.
     *
     * The options parameter may have an object with 'model' (a Query) and 'ui' (a selection)
     *
     * The model and into parameters will be stored as query.model and query.into.
     *
     * A new Query will be initialized if model is not set.
     *
     * If into is not set, a new form element will be created for the controls.
     *
     * @param options
     * @constructor
     */
    var QueryControls = function (options) {

        this.model = options.model || new Query();
        this.into = options.into || $('<form>');
        this.api = options.api;

        this._initUI();
        this._fillForm();

        this._initEvents();
    };

    //Add 'on' and 'trigger'
    events(QueryControls);

    /**
     * Find several important UI elements.
     *
     * @private
     */
    QueryControls.prototype._initUI = function () {
        this.ui = {};

        this.ui.form = this.into; //an alias
        this.ui.search_input = this.into.find('.query-search');
        this.ui.author_input = this.into.find('.query-author');
        this.ui.rt_checkbox = this.into.find('.query-rt');
//        this.ui.min_rt_input = this.into.find('.query-minrt');
        this.ui.sentiment_select = this.into.find('.query-sentiment');
        this.ui.update_button = this.into.find('.query-update');
    };

    /**
     * Set up handlers for UI events.
     *
     * @private
     */
    QueryControls.prototype._initEvents = function () {
        this.model.on('change', $.proxy(this._fillForm, this));

//        this.ui.update_button.on('click', $.proxy(this._updateClicked, this));

        this.ui.form.find('input,select').on('change', $.proxy(this._updateClicked, this));

        this.ui.form.on('submit', $.proxy(this._formSubmitted, this));

        var self = this;
        this.ui.form.on('mouseenter', function() {
            self.api.trigger('brush', [{
                type: 'query',
                id: self.model.id()
            }]);
        });

        this.ui.form.on('mouseleave', function() {
            self.api.trigger('unbrush', [{
                type: 'query',
                id: self.model.id()
            }]);
        });
    };

    /**
     * Called when the update button is clicked for this query.
     *
     * @private
     */
    QueryControls.prototype._updateClicked = function () {
        this.collectData();
    };

    /**
     * Called when a view control button is clicked.
     *
     * @private
     */
    QueryControls.prototype._viewButtonClicked = function () {

        //Get the mode of the active mode button
        var mode = this.ui.view_buttons.find('.active').data('mode');

        //Save on the model
        this.model.view(mode);
    };

    /**
     * Called when the form is submitted (probably user pressed enter).
     *
     * @private
     */
    QueryControls.prototype._formSubmitted = function (e) {
        e.preventDefault();
        this._updateClicked();
        return false;
    };

    /**
     * Gather user input from the query controls.
     *
     * Returns false if any values were invalid, and this.model.invalid will be
     * set to a useful message.
     */
    QueryControls.prototype.collectData = function () {

        var data = {};

        //Get the search string
        data.search = $.trim(this.ui.search_input.val()) || null;

        //Get the author string
        data.author = $.trim(this.ui.author_input.val()) || null;

        //Correct the author string
        if (data.author && data.author[0] != '@') {
            data.author = '@' + data.author;
            this.ui.author_input.val(data.author);
        }

        //Get whether or not to show retweets
        data.rt = this.ui.rt_checkbox.is(':checked');

        //Get the minimum RT count (validate first)
//        data.min_rt = Number(this.ui.min_rt_input.val());

        //Get the selected sentiment filter, with validation
        data.sentiment = this.ui.sentiment_select.val();
//        data.sentiment = data.sentiment ? Number(data.sentiment) : null;


        return this.model.set(data);
    };

    /**
     * Place stored data into the query controls.
     *
     * @private
     */
    QueryControls.prototype._fillForm = function () {

        //Set the search string
        this.ui.search_input.val(this.model.search());

        //Set the author string, adding an @ if needed
        var author = this.model.author();
        if (author && author[0] != '@') {
            author = '@' + author;
            this.ui.author_input.val(author);
        }

        //Set the retweets checkbox
        this.ui.rt_checkbox.prop('checked', this.model.rt());

        //Set the min retweets filter
//        this.ui.min_rt_input.val(this.model.min_rt());

        this.ui.sentiment_select.val(this.model.sentiment());
    };

    return QueryControls;
});