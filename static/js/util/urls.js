define(['jquery', 'underscore', 'lib/Uri', 'util/events'], function ($, _, Uri, events) {

    var UrlsManager = function() {

    };

    //Only need the constructor above for this
    events(UrlsManager);

    //Singleton
    var urls = new UrlsManager();

    /**
     * Map from query data field names to url parameter names.
     */
    var PARAMETER_NAME_MAP = {
        search: 'q',
        author: 'a',
        rt: 'r',
        min_rt: 'm',
        sentiment: 'f'
    };

    /**
     * Map from query data field names to functions that convert the value for URLs.
     */
    var TO_URL_CONVERSION = {
        rt: function (value) {
            return value ? '1' : '';
        }
    };

    /**
     * Map from query data field names to functions that conver the value from URLs.
     */
    var FROM_URL_CONVERSION = {
        rt: function (value) {
            return value === '1';
        },
        min_rt: Number,
        focus: function(value) {
            if (value) {
                return Number(value);
            } else {
                return null;
            }
        }
    };

    /**
     * Given a nice parameter name (i.e. 'view') and
     * the query index (1, 2), generate the short url name (i.e. 'v0').
     *
     * @param name
     * @param queryIndex
     */
    function parameterName(name, queryIndex) {
        if (name in PARAMETER_NAME_MAP) {
            return PARAMETER_NAME_MAP[name] + queryIndex.toString();
        }
    }

    /**
     * Decode a string for urls.
     * http://stackoverflow.com/questions/4292914/javascript-url-decode-function
     * http://phpjs.org/functions/urldecode/
     *
     * @param str
     * @returns {string}
     */
    function urldecode(str) {
        if (!str) {
            return str;
        }
        return decodeURIComponent((str + '').replace(/\+/g, '%20'));
    }

    /**
     * Encode a string for urls.
     * http://phpjs.org/functions/urlencode/
     * @param str
     * @returns {string}
     */
    function urlencode(str) {
        if (!str) {
            return str;
        }

        str = (str + '').toString();

        // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
        // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
            replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    }

    /**
     * Get the list of query fields supported as URL parameters.
     * @returns {Array}
     */
    urls.get_supported_query_field = function () {
        return _.keys(PARAMETER_NAME_MAP);
    };

    /**
     * Parse a url (optional).
     *
     * Returns an object with a 'get' and 'get_at' function. The 'get' function can look up a name
     * in the query string, using a default value if not found.
     * The 'get_at' function, for query data, converts the name into its url version and adds the index
     * before looking it up.
     *
     * @param url
     * @returns {{get: Function, get_at: Function}}
     */
    urls.parse = function (url) {
        url = url || document.location.href;

        var parsed = new Uri(url);

        return {
            get: function (key, defaultValue) {
                var value = urldecode(parsed.getQueryParamValue(key));

                if (value === undefined) {
                    return defaultValue;
                }

                if (key in FROM_URL_CONVERSION) {
                    value = FROM_URL_CONVERSION[key](value);
                }

                return value;
            },
            get_at: function (key, index, defaultValue) {

                //Turn the field name into a URL parameter
                var name = parameterName(key, index);

                var value = urldecode(parsed.getQueryParamValue(name));
                if (value === undefined) {
                    return defaultValue;
                }

                if (key in FROM_URL_CONVERSION) {
                    value = FROM_URL_CONVERSION[key](value);
                }

                return value;
            }
        };
    };

    //////////// Below is about updating parameters ///////////////

    /**
     * Transforms a raw query data object into an object with URL-ready keys and values.
     * If index is provided, it will be used to specialize the key urls.
     *
     * @param queryData
     * @returns {{}}
     */
    function prepareQueryData(queryData) {
        var id = queryData.id || 0;

        var result = {};

        _.each(queryData, function (value, key) {
            if (key in TO_URL_CONVERSION) {
                value = TO_URL_CONVERSION[key](value);
            }

            key = parameterName(key, id);

            //Only set the result if the key was valid
            if (key) {
                result[key] = value;
            }
        });

        return result;
    }

    /**
     * Generate a query string for the given parameters and query data objects.
     *
     * @param parameters
     * @param queries
     * @returns {string}
     */
    urls.make_url = function (parameters, queries) {
        parameters = parameters || {};
        queries = queries || [];

        queries.forEach(function (query, index) {
            query = prepareQueryData(query);

            _.extend(parameters, query);
        });

        return '?' + $.param(parameters);
    };

    /**
     * Update the url with the provided parameters and query data objects.
     *
     * @param parameters An object containing generic parameter settings.
     * @param queries A list of query data objects. These may be specially processed.
     */
    urls.update_url = function (parameters, queries) {

        var url = urls.make_url(parameters, queries);

        //Fancy HTML5 history management
        if (url !== document.location.search) {
            history.pushState(url, '', url);
        }
    };

    /**
     * Get the current query string.
     */
    urls.query_string = function(url) {
        url = url || document.location.href;

        var parsed = new Uri(url);

        return decodeURIComponent(parsed.query());
    };

    /**
     * Set the current query string.
     *
     * @param query
     */
    urls.set_query_string = function(query) {
        var parsed = new Uri(document.location.href);
        parsed.query(query);

        //Fancy HTML5 history management
        var url = decodeURIComponent(parsed.query());
        if (url !== document.location.href) {
            history.pushState(url, '', url);
            this.trigger('change');
        }
    };

    urls.watch_url_changes = function() {
        if (!this._watching) {
            this._watching = true;
            var url = document.location.href;

            var self = this;
            $(window).on('popstate', function() {
                var newUrl = document.location.href;
                if (newUrl !== url) {
                    url = newUrl;

                    self.trigger('change');
                }
            });
        }
    };

    urls.configure = function(url_map) {
        urls.url_map = url_map;
    };

    urls.get_url = function(name) {
        return urls.url_map[name];
    };

    return urls;
});