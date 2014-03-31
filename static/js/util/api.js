define(['jquery', 'underscore', 'util/events'], function ($, _, events) {

    /**
     * A map from API request names to urls.
     */
    var URLS = {
        'counts': 'api/counts.php',
        'discussions': 'api/discussions.php',
        'messages': 'api/messages.php',
        'tweets': 'api/tweets.php',
        'annotations': 'api/annotations.php',
        'keywords': 'api/burst_keywords.php',
        'users': 'api/users.php',
        'auth': 'api/auth.php'
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
    var API = function () {

        this.urls = {};
        this.rid_counters = {};

        for (var name in URLS) {
            //Initialize the local URLS dictionary
            this.urls[name] = URLS[name];
        }
    };

    /**
     * Method to register a new URL after the fact, mostly useful for testing.
     *
     * @param name the request type name
     * @param url the url to request from
     * @param [method] an optional shorthand method to add to the API object
     */
    API.prototype.register = function (name, url, method) {
        this.urls[name] = url;

        if (method) {
            this[name] = method;
        }
    };

    API.prototype.get_last_rid_sent = function (name) {
        if (name in this.rid_counters) {
            return this.rid_counters[name].sent;
        } else {
            return 0;
        }
    };

    API.prototype.get_last_rid_received = function (name) {
        if (name in this.rid_counters) {
            return this.rid_counters[name].received;
        } else {
            return 0;
        }
    };

    /**
     * The workhorse method for all API requests.
     * Request parameters must already be prepared for sending to the server.
     *
     * The optional parameters argument can include:
     * - params: an object containing the request parameters.
     * - post_process: a function to post-process the results before distribution
     * - request_name: use this to override the name used to track requests
     *
     * @param method 'get', 'post'
     * @param name the API url name
     * @param [parameters] {{}}
     * @private
     */
    API.prototype.request = function (method, name, parameters) {
        parameters = parameters || {};

        var params = parameters.params || {};
        var post_process = parameters.post_process;
        var request_name = parameters.request_name || name;

        //Check if rid is initialized
        if (!this.rid_counters[request_name]) {
            this.rid_counters[request_name] = {
                sent: 0,
                received: 0
            };
        }

        //Make a new request id
        this.rid_counters[request_name].sent++;

        //Add the request id to the options
        var rid = this.rid_counters[request_name].sent;

        console.log("Sending " + request_name + ":" + rid, params);

        //Issue an AJAX request
        var r = $.ajax({
            url: this.urls[name],
            data: params,
            type: method,
            dataType: 'json'
        });

        var self = this;
        r.done(function (result) {

            console.log("Received " + request_name + ":" + rid);

            //Make sure the request is more recent than the last one received for this name
            var lastReceived = self.rid_counters[request_name].received;
            if (lastReceived >= rid) {
                return;
            }

            //This is the last one received for this name
            self.rid_counters[request_name].received = rid;

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

        r.fail(function(xhr, textStatus) {
            console.error('Error on ' + request_name + ":" + rid, textStatus, xhr);
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
    API.prototype.counts = function (parameters) {
        var queryId = parameters.query_id;
        this.request('get', 'counts', {
            params: parameters,
            post_process: function (results) {
                //Post-processing is just extracting the payload
                return results.payload;
            },
            //Have to make sure requests for different queries don't get crossed
            request_name: 'counts-' + queryId
        });
    };

    /**
     * Request discussions. Subscribe to the discussions event to receive data
     * when it arrives.
     *
     * @param parameters
     */
    API.prototype.discussions = function (parameters) {
        this.request('get', 'discussions', {
            params: parameters,
            post_process: function (results) {
                return results.payload;
            }
        });
    };

    /**
     * Request messages for a discussion. Subscribe to the messages event to receive data
     * when it arrives.
     *
     * @param parameters
     */
    API.prototype.messages = function (parameters) {
        this.request('get', 'messages', {
            params: parameters,
            post_process: function (results) {
                return results.payload;
            }
        });
    };

    /**
     * Send a message. The result will be an updated message list.
     *
     * @param parameters
     */
    API.prototype.send_message = function(parameters) {
        this.request('post', 'messages', {
            params: parameters,
            post_process: function (results) {
                return results.payload;
            }
        });
    };

    /**
     * Request tweets that satisfy a set of filters.
     *
     * @param parameters
     */
    API.prototype.tweets = function(parameters) {
        var queryId = parameters.query_id;

        this.request('get', 'tweets', {
            params: parameters,
            post_process: function(results) {
                return results.payload;
            },
            //Have to make sure requests for different queries don't get crossed
            request_name: 'tweets-' + queryId
        });
    };

    API.prototype.annotations = function(parameters) {
        this.request('get', 'annotations', {
            params: parameters,
            post_process: function (results) {
                return results.payload;
            }
        });
    };

    API.prototype.annotate = function(parameters) {
        this.request('post', 'annotations', {
            params: parameters,
            post_process: function (results) {
                return results.payload;
            }
        });
    };


    API.prototype.keywords = function(parameters) {
        this.request('get', 'keywords', {
            params: parameters,
            post_process: function(results) {
                return results.payload;
            }
        });
    };

    API.prototype.users = function(parameters) {
        var queryId = parameters.query_id;

        this.request('get', 'users', {
            params: parameters,
            post_process: function(results) {
                return results.payload;
            },
            //Have to make sure requests for different queries don't get crossed
            request_name: 'users-' + queryId
        });
    };

    API.prototype.auth = function(parameters) {
        this.request('get', 'auth', {
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