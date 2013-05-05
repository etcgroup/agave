define(['jquery', 'underscore', 'util/events'], function($, _, events) {

    /**
     * A map from API request names to urls.
     */
    var URLS = {
        'counts': 'data/counts.php',
        'overview_counts': 'data/overview_counts.php'
    };

    /**
     * API is an object that knows how to asynchronously
     * request data from the server and send data to the server.
     *
     * It is in charge of all URLs, but knows nothing about the data it is sending
     * or receiving.
     *
     * Since requests may be fulfilled out of order, it filters the
     * results at the query name level to ensure that data
     * returned is never older than some other data that was already
     * returned.
     *
     * Data events are triggered with an object containing request params and the data (result).
     */
    var API = function() {

        this.urls = {};
        this.rid_counters = {};

        for (var name in URLS) {
            //Initialize the local URLS dictionary
            this.urls[name] = URLS[name];

            //Initialize the request id counters
            this.rid_counters[name] = {
                sent: 0,
                received: 0
            };
        }
    };

    /**
     * Method to register a new URL after the fact, mostly useful for testing.
     *
     * @param name the request type name
     * @param url the url to request from
     * @param [method] an optional shorthand method to add to the API object
     */
    API.prototype.register = function(name, url, method) {
        this.rid_counters[name] = {
            sent: 0,
            received: 0
        };

        this.urls[name] = url;

        if (method) {
            this[name] = method;
        }
    };

    API.prototype.get_last_rid_sent = function(name){
        return this.rid_counters[name].sent;
    };

    API.prototype.get_last_rid_received = function(name){
        return this.rid_counters[name].received;
    };

    /**
     * The workhorse method for all API requests.
     * Request parameters must already be prepared for sending to the server.
     *
     * The optional parameters argument can include:
     * - params: an object containing the request parameters.
     * - post_process: a function to post-process the results before distribution
     *
     * @param method 'get', 'post'
     * @param name the API url name
     * @param [parameters] {{}}
     * @private
     */
    API.prototype.request = function(method, name, parameters) {
        parameters = parameters || {};

        var params = parameters.params || {};
        var post_process = parameters.post_process;

        //Make a new request id
        this.rid_counters[name].sent++;

        //Add the request id to the options
        var rid = this.rid_counters[name].sent;

        //Issue an AJAX request
        var r = $.ajax({
            url: this.urls[name],
            data: params,
            type: method
        });

        var self = this;
        r.done(function(result) {

            console.log("Received " + name + ":" + rid);

            //Make sure the request is more recent than the last one received for this name
            var lastReceived = self.rid_counters[name].received;
            if (lastReceived >= rid) {
                return;
            }

            //This is the last one received for this name
            self.rid_counters[name].received = rid;

            //Push the params through a post processing step, if provided
            if (post_process) {
                result = post_process(result);
            }

            //Trigger a new params event, providing the params and result
            self.trigger(name, {
                params: params,
                data: result
            });
        });
    };

    /**
     * Request tweet counts.
     *
     * Parameters should include the necessary arguments for the server
     * to process the request.
     *
     * In order to receive the results, you should subscribe to the 'counts' event.
     *
     * @param parameters
     */
    API.prototype.counts = function(parameters) {
        this.request('get', 'counts', {
            params: parameters,
            post_process: function (results) {
                //Post-processing is just extracting the payload
                return results.payload;
            }
        });
    };

    /**
     * Request tweet counts. Subscribe to the overview_counts event
     * to receive the data when it arrives.
     *
     * @param parameters
     */
    API.prototype.overview_counts = function(parameters) {
        this.request('get', 'overview_counts', {
            params: parameters,
            post_process: function(results) {
                return results.payload;
            }
        });
    };

    //Mix in events
    events(API);

    return API;
});