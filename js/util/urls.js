define(['jquery', 'underscore', 'lib/Uri'], function($, _, Uri) {

    var urls = {};

    /**
     * Map from query data field names to url parameter names.
     */
    var PARAMETER_NAME_MAP = {
        view: 'v',
        search: 'q',
        author: 'a',
        rt: 'r',
        min_rt: 'm',
        sentiment: 'f'
    };

    /**
     * Given a nice parameter name (i.e. 'view') and
     * the query index (1, 2), generate the short url name (i.e. 'v0').
     *
     * @param name
     * @param queryIndex
     */
    function parameterName(name, queryIndex) {
        return PARAMETER_NAME_MAP[name] + queryIndex.toString();
    }

    /**
     * Get the list of query fields supported as URL parameters.
     * @returns {Array}
     */
    urls.get_supported_query_field = function() {
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
    urls.parse = function(url) {
        url = url || document.location.uri;

        var parsed = new Uri(url);

        return {
            get: function(name, defaultValue) {
                var value = parsed.getQueryParamValue(name);
                if (value === undefined) {
                    return defaultValue;
                }
                return value;
            },
            get_at: function(name, index, defaultValue) {

                //Turn the field name into a URL parameter
                name = parameterName(name, index);

                var value = parsed.getQueryParamValue(name);
                if (value === undefined) {
                    return defaultValue;
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
     * @param index
     * @returns {{}}
     */
    function prepareQueryData(queryData, index) {
        index = index || 0;

        var result = {};

        _.each(queryData, function(value, key) {
            if (key === 'rt') {
                value = value ? '1' : '';
            }

            key = parameterName(key, index);

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
    urls.make_url = function(parameters, queries) {
        parameters = parameters || {};
        queries = queries || [];

        queries.forEach(function(query, index) {
            query = prepareQueryData(query, index);

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
    urls.update_url = function(parameters, queries) {

        var url = urls.make_url(parameters, queries);

        //Fancy HTML5 history management
        history.pushState(url, '', url);
    };

    return urls;
});