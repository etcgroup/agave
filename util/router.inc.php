<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    exit();
}

class Router
{

    private $_uri;
    private $_route;
    private $_index_page;
    private $_base_url;

    private $routes = array(
        //route name => array(route path, handler file)
        'annotations' => array('(?<corpus_id>\w+)/api/annotations', 'views/api/annotations.inc.php'),
        'keywords' => array('(?<corpus_id>\w+)/api/burst_keywords', 'views/api/burst_keywords.inc.php'),
        'counts' => array('(?<corpus_id>\w+)/api/counts', 'views/api/counts.inc.php'),
        'discussions' => array('(?<corpus_id>\w+)/api/discussions', 'views/api/discussions.inc.php'),
        'messages' => array('(?<corpus_id>\w+)/api/messages', 'views/api/messages.inc.php'),
        'tweets' => array('(?<corpus_id>\w+)/api/tweets', 'views/api/tweets.inc.php'),
        'users' => array('(?<corpus_id>\w+)/api/users', 'views/api/users.inc.php'),
        'auth' => array('(?<corpus_id>\w+)/auth', 'views/auth.inc.php'),
        'vis' => array('(?<corpus_id>\w+)', 'views/vis.inc.php'),
        'about' => array('', 'views/about.inc.php'),
    );

    /**
     * @param $config Config
     */
    function __construct($config)
    {
        //From https://github.com/EllisLab/CodeIgniter/wiki/Automatic-configbase-url
        $this->_base_url = ($this->is_https() ? 'https' : 'http') .
            '://' .
            $_SERVER['HTTP_HOST'] .
            str_replace('//', '/', dirname($_SERVER['SCRIPT_NAME']) . '/');

        $this->_index_page = $config->get('index_page', 'index.php');

        $this->_uri = $this->_parse_request_uri();
        $this->_route = $this->_parse_route();
    }

    public function get_route()
    {
        return $this->_route;
    }

    public function current_url()
    {
        return $this->_uri;
    }

    public function is_https()
    {
        return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    }

    public function route_urls($corpus_id)
    {
        $result = array();

        $params = array('corpus_id' => $corpus_id);
        foreach ($this->routes as $name => $route) {
            $route_url = $this->_reverse($route[0], $params);
            $result[$name] = $this->site_url($route_url);
        }

        return $result;
    }

    public function route_url($route_name, $corpus_id) {
        $params = array('corpus_id' => $corpus_id);
        $route = $this->routes[$route_name];
        $route_url = $this->_reverse($route[0], $params);
        return $this->site_url($route_url);
    }

    private function _reverse($route, $arguments)
    {
        foreach ($arguments as $name => $arg) {
            $route = preg_replace("/\(\?\<$name\>[^)]*\)/", $arg, $route, 1);
        }
        return $route;
    }

    /**
     * Returns the route parameters in an array
     * if it matches the url, or NULL if not a match.
     *
     * @param $route
     * @param $url
     * @return array|null
     */
    private function _match_route($route, $url)
    {
        $expression = '!^' . $route . '$!';
        $matches = array();
        if (preg_match($expression, $url, $matches)) {
            $arguments = array();
            foreach ($matches as $key => $value) {
                if (!is_numeric($key)) {
                    $arguments[$key] = $value;
                }
            }
            return $arguments;
        } else {
            return NULL;
        }
    }

    protected function _parse_route()
    {
        $current_url = $this->current_url();

        foreach ($this->routes as $name => $route) {

            $route_path = $route[0];
            $target = $route[1];

            $args = $this->_match_route($route_path, $current_url);
            if ($args !== NULL) {
                return array($target, $args);
            }
        }

        return NULL;

//        $target = $this->routes;
//        $segments = explode('/', $this->_uri);
//
//        //Process routes until we find a match
//        $segment_i = 0;
//        while (is_array($target) && $segment_i < count($segments)) {
//            $matched = NULL;
//            foreach ($target as $key => $value) {
//
//                //This key matches anything
//                if ($key === '') {
//                    //Don't increment $segment_i because we didn't actually consume a segment for this match
//                    $matched = $value;
//                    break;
//                }
//
//                if ($key === $segments[$segment_i]) {
//                    //This segment matches this target so advance to the next segment
//                    $segment_i += 1;
//                    $matched = $value;
//                    break;
//                }
//            }
//
//            if (!$matched) {
//                //No match :(
//                return NULL;
//            } else {
//                $target = $matched;
//            }
//        }
//
//        //If there are more segments we didn't process
//        //then those will become arguments to the target
//        $arguments = array_slice($segments, $segment_i);
//        return array($target, $arguments);
    }

    /**
     * Parse REQUEST_URI
     *
     * Will parse REQUEST_URI and automatically detect the URI from it,
     * while fixing the query string if necessary.
     *
     * @return    string
     */
    protected function _parse_request_uri()
    {
        if (!isset($_SERVER['REQUEST_URI'], $_SERVER['SCRIPT_NAME'])) {
            return '';
        }

        $uri = parse_url($_SERVER['REQUEST_URI']);
        $query = isset($uri['query']) ? $uri['query'] : '';
        $uri = isset($uri['path']) ? rawurldecode($uri['path']) : '';

        if (strpos($uri, $_SERVER['SCRIPT_NAME']) === 0) {
            $uri = (string)substr($uri, strlen($_SERVER['SCRIPT_NAME']));
        } elseif (strpos($uri, dirname($_SERVER['SCRIPT_NAME'])) === 0) {
            $uri = (string)substr($uri, strlen(dirname($_SERVER['SCRIPT_NAME'])));
        }

        // This section ensures that even on servers that require the URI to be in the query string (Nginx) a correct
        // URI is found, and also fixes the QUERY_STRING server var and $_GET array.
        if (trim($uri, '/') === '' && strncmp($query, '/', 1) === 0) {
            $query = explode('?', $query, 2);
            $uri = rawurldecode($query[0]);
            $_SERVER['QUERY_STRING'] = isset($query[1]) ? $query[1] : '';
        } else {
            $_SERVER['QUERY_STRING'] = $query;
        }

        parse_str($_SERVER['QUERY_STRING'], $_GET);

        if ($uri === '/' OR $uri === '') {
            return '';
        }

        // Do some final cleaning of the URI and return it
        return $this->_remove_relative_directory($uri);
    }

    /**
     * Remove relative directory (../) and multi slashes (///)
     *
     * Do some final cleaning of the URI and return it, currently only used in self::_parse_request_uri()
     *
     * @param    string $uri
     * @return    string
     */
    protected function _remove_relative_directory($uri)
    {
        $uris = array();
        $tok = strtok($uri, '/');
        while ($tok !== FALSE) {
            if ((!empty($tok) OR $tok === '0') && $tok !== '..') {
                $uris[] = $tok;
            }
            $tok = strtok('/');
        }

        return implode('/', $uris);
    }

    /**
     * Base URL
     *
     * Returns base_url [. uri_string]
     *
     * @uses    CI_Config::_uri_string()
     *
     * @param    string|string[] $uri URI string or an array of segments
     * @param    string $protocol
     * @return    string
     */
    public function base_url($uri = '', $protocol = NULL)
    {
        $base_url = $this->_slash($this->_base_url);

        if (isset($protocol)) {
            $base_url = $protocol . substr($base_url, strpos($base_url, '://'));
        }

        $uri = trim($uri, '/');

        return $base_url . $uri;
    }

    /**
     * Site URL
     *
     * Returns base_url . index_page [. uri_string]
     *
     * @uses    CI_Config::_uri_string()
     *
     * @param    string|string[] $uri URI string or an array of segments
     * @param    string $protocol
     * @return    string
     */
    public function site_url($uri = '', $protocol = NULL)
    {
        $base_url = $this->_slash($this->_base_url);

        if (isset($protocol)) {
            $base_url = $protocol . substr($base_url, strpos($base_url, '://'));
        }

        if (empty($uri)) {
            return $base_url . $this->_index_page;
        }

        $uri = trim($uri, '/');

        return $base_url . $this->_slash($this->_index_page) . $uri;
    }

    /**
     * Make sure the string has one slash after it, or empty.
     *
     * @param $str
     * @return string
     */
    private function _slash($str)
    {
        if (trim($str) === '') {
            return '';
        }

        return rtrim($str, '/') . '/';
    }
} 