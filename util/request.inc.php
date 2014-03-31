<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'performance.inc.php';
include_once 'queries.inc.php';

/**
 * The Request class collects together several disparate pieces of information that
 * are relevant to each request:
 *      - request parameters
 *      - database connection
 *      - performance stats
 *
 * The bulk of the class is a utility for processesing $_GET parameters, the get()
 * method, which is used to retreive specific $_GET variables as an object.
 *
 * It also defines some convenience methods for handling common parameters,
 * such as times, which need to be converted from ms to DateTime objects.
 */
class Request
{
    public $config;
    private $performance = NULL;
    /**
     * @var Queries
     */
    private $db = NULL;
    private $user_cookie_name = 'user_data';
    private $_user_data;

    public function __construct($config_file = NULL)
    {

        if ($config_file === NULL) {
            $config_file = '../app.ini';
        }

        $config_file_path = realpath($config_file);
        if ($config_file_path === FALSE) {
            trigger_error("Config file $config_file does not exist", E_USER_ERROR);
        }

        $this->config = parse_ini_file($config_file_path, TRUE);
        if ($this->config === FALSE) {
            trigger_error("Error parsing $config_file_path", E_USER_ERROR);
        }
    }

    public function is_env($environment)
    {
        return isset($this->config['environment']) && $this->config['environment'] == $environment;
    }

    public function ga_id()
    {
        if (isset($this->config['google'])) {
            return $this->config['google']['id'];
        }
    }

    public function ga_domain()
    {
        if (isset($this->config['google'])) {
            return $this->config['google']['domain'];
        }
    }

    public function auth_mode()
    {
        if (isset($this->config['auth_mode'])) {
            return $this->config['auth_mode'];
        } else {
            return 'simple';
        }
    }

    public function keep_data_private() {
        if (isset($this->config['keep_data_private'])) {
            return (bool)($this->config['keep_data_private']);
        } else {
            return FALSE;
        }
    }

    /**
     * Get a performance timer for this request.
     * @return Performance
     */
    public function timing()
    {
        $this->performance = new Performance();

        if ($this->db) {
            //If the db is already initialized, share the performance tracker with it
            $this->db->record_timing($this->performance);
        }

        return $this->performance;
    }

    /**
     * Initialize and get the database connection for this request.
     * @param string|array $params
     * @return \Queries
     */
    public function db($params = NULL)
    {
        $this->db = new Queries($this);

        if ($this->performance) {
            //If the performance tracker is already initialized, share it with the db
            $this->db->record_timing($this->performance);
        }

        return $this->db;
    }

    /**
     * Call without any parameters to retrieve (and clear) the current flash message.
     * The result will be an array containing 'message' and 'type'.
     *
     * Call with a string and an optional flash type to save a message.
     *
     * @param string $message
     * @param string $type
     * @return mixed
     */
    public function flash($message=NULL, $type='error')
    {
        if ($message !== NULL) {

            $_SESSION['flash'] = $message;
            $_SESSION['flash_type'] = $type;

        } else if (isset($_SESSION['flash'])) {
            $message = $_SESSION['flash'];
            $type = $_SESSION['flash_type'];
            unset($_SESSION['flash']);
            unset($_SESSION['flash_type']);
            return array(
                'message' => $message,
                'type' => $type
            );
        } else {
            return NULL;
        }
    }

    /**
     * JSON encode and print the response.
     *
     * The response will be an object containing the payload,
     * as well as request and performance data for debugging.
     *
     * @param mixed $payload
     */
    public function response($payload)
    {
        $response = array(
            'payload' => $payload
        );

        $response['request'] = $_GET;

        if ($this->performance !== NULL) {
            $response['performance'] = $this->performance->finalize();
        }

        header('Content-type: application/json');
        echo json_encode($response);
    }

    /**
     * Returns an object containing data about the user,
     * based on cookie info. Null if no or invalid data.
     *
     * @param bool $sign_in
     * @return mixed|null
     */
    public function user_data($sign_in = FALSE) {
        if (!$this->_user_data) {
            if (isset($_SESSION['user_id'])) {
                $this->_user_data = $this->db->get_app_user($_SESSION['user_id'], $sign_in);
                if ($this->_user_data) {
                    $this->_user_data = (object)$this->_user_data;
                } else {
                    //The user id was BADDDDD
                    $this->sign_out();
                    $this->db->log_action('bad user id');
                }
            }
        }

        return $this->_user_data;
    }

    /**
     * Clear any cached user data and sign out.
     */
    public function sign_out() {
        $this->_user_data = NULL;
        unset($_SESSION['oauth_token']);
        unset($_SESSION['oauth_token_secret']);
        unset($_SESSION['oauth_verify']);
        unset($_SESSION['user_id']);
    }

    /**
     * Collects GET request parameters.
     *
     * The first argument is an array of required parameters names.
     * If a required parameter is missing, an Exception will be thrown.
     *
     * The second argument (optional) is an array of optional parameters to
     * look for. Any of these that are missing will default to NULL in the result.
     *
     * @param array $required The required parameters
     * @param array $optional The optional parameters (optional)
     * @throws Exception
     * @return type
     */
    public function get($required, $optional = array())
    {
        return $this->_retrieve_params($_GET, $required, $optional);
    }

    /**
     * Collects POST request parameters.
     *
     * The first argument is an array of required parameters names.
     * If a required parameter is missing, an Exception will be thrown.
     *
     * The second argument (optional) is an array of optional parameters to
     * look for. Any of these that are missing will default to NULL in the result.
     *
     * @param array $required The required parameters
     * @param array $optional The optional parameters (optional)
     * @throws Exception
     * @return type
     */
    public function post($required, $optional = array())
    {
        return $this->_retrieve_params($_POST, $required, $optional);
    }

    public function _retrieve_params($global, $required, $optional = array())
    {
        $request = array();
        foreach ($required as $param_name) {
            if (array_key_exists($param_name, $global)) {
                $request[$param_name] = $global[$param_name];
            } else {
                throw new Exception("Parameter $param_name is required");
            }
        }

        foreach ($optional as $param_name) {
            if (array_key_exists($param_name, $global)) {
                $request[$param_name] = $global[$param_name];
            } else {
                $request[$param_name] = NULL;
            }
        }

        return (object)$request;
    }

    /**
     * Get 'from' and 'to' DateTimes.
     *
     * @return object
     */
    public function timeParameters()
    {
        $params = $this->get(array('from', 'to'));

        $from = (int)($params->from / 1000);
        $to = (int)($params->to / 1000);

        return (object)array(
            'from' => new DateTime("@$from"),
            'to' => new DateTime("@$to"),
        );
    }

    /**
     * Get the query model parameters: 'min_rt', 'rt', 'search', 'author', and 'sentiment'.
     */
    public function queryParameters()
    {
        $times = $this->timeParameters();
        $params = $this->get(array(), array('min_rt', 'rt', 'search', 'author', 'sentiment'));

        //Pull in the time range
        $params->from = $times->from;
        $params->to = $times->to;

        //Convert to boolean
        $params->rt = $params->rt === 'true';

        //Reset these ones to null if they are empty
        $params->search = strlen($params->search) ? $params->search : NULL;
        $params->sentiment = strlen($params->sentiment) ? $params->sentiment : NULL;
        $params->screen_name = strlen($params->author) ? $params->author : NULL;

        //Look up the author
        if (strlen($params->author)) {
            $user = $this->db->get_user_by_name($params->author);
            if ($user !== NULL) {
                $params->author = $user['id'];
            } else {
                //No getting off easy if you can't find them
                $params->author = -1;
            }
        } else {
            $params->author = NULL;
        }

        return $params;
    }

    /**
     * Get 'from' and 'to' DateTimes, as well as
     * a grouping 'interval'.
     *
     * @return object
     */
    public function binnedTimeParams()
    {
        $bundle = $this->timeParameters();

        $params = $this->get(array('interval'));
        $interval = (int)($params->interval / 1000);

        if ($interval == 0)
            $interval = 1;

        $bundle->interval = (int)$interval;

        return $bundle;
    }

    public function stat($path, $return=FALSE) {
        if (array_key_exists('static_url', $this->config)) {
            $static_url = rtrim($this->config['static_url'], '/');
        } else {
            $static_url = '/static';
        }

        if ($return) {
            return $static_url . '/' . ltrim($path, '/');
        } else {
            echo $static_url . '/' . ltrim($path, '/');
        }
    }
}
