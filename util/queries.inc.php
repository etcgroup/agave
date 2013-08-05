<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

include_once 'builder.inc.php';
include_once 'binder.inc.php';
include_once 'session.inc.php';

/**
 * The Queries class contains all of the SQL queries for retrieving data.
 * It also encapsulates the database connection.
 *
 * For convenience, each query is defined right above the function
 * where it is used.
 *
 * To add new operations, add a new _build_*() function to prepare
 * the query along with a paired get_*() function.
 */
class Queries
{

    /**
     * @var PDO
     */
    private $db;
    /**
     * @var PDO
     */
    private $corpus;
    private $corpus_id;
    //The value used to filter user generated content
    private $public = 1;
    private $logging_enabled = 1;
    private $session_handler;

    /**
     * @var PDOStatement[]
     */
    private $queries;
    private $types;
    /**
     * @var Performance
     */
    private $performance;
    private $utc;


    /**
     * Construct a new Queries object.
     *
     * $params must be an associative array containing 'host', 'port', 'user', 'password', and 'schema'.
     *
     * @param $config
     * @internal param array $params
     */
    public function __construct($config)
    {
        $this->utc = new DateTimeZone('UTC');

        if (isset($config['public'])) {
            $this->public = $config['public'];
        }

        if (isset($config['logging_enabled'])) {
            $this->logging_enabled = $config['logging_enabled'];
        }

        $params = $config['db'];
        if (!is_array($params)) {
            print "No DB params";
            die();
        }

        if (!array_key_exists('port', $params)) {
            $params['port'] = 3306;
        }

        $pdo_string = "mysql:host=${params['host']};dbname=${params['schema']};port=${params['port']}";

        //Create a persistent PDO connection
        try {
            $this->db = new PDO($pdo_string, $params['user'], $params['password'], array(
                PDO::ATTR_PERSISTENT => true
            ));
        } catch (PDOException $e) {
            echo 'Connection failed: ' . $e->getMessage();
            die();
        }

        $corpus_id = $params['corpus'];
        if (!isset($config["corpus-$corpus_id"]) || !is_array($config["corpus-$corpus_id"])) {
            //Re-use the same connection and hope the data is there! this should not be used in production
            $this->corpus_id = 'self';
            $this->corpus = $this->db;
        } else {
            $this->corpus_id = $corpus_id;

            $params = $config["corpus-$corpus_id"];

            //Load a second database connection for the corpus data
            if (!array_key_exists('port', $params)) {
                $params['port'] = 3306;
            }

            $pdo_string = "mysql:host=${params['host']};dbname=${params['schema']};port=${params['port']}";

            //Create a persistent PDO connection
            try {
                $this->corpus = new PDO($pdo_string, $params['user'], $params['password'], array(
                    PDO::ATTR_PERSISTENT => true
                ));
            } catch (PDOException $e) {
                echo 'Connection failed: ' . $e->getMessage();
                die();
            }
        }

        $this->build_queries();
        $this->set_timezone();
        $this->set_encoding();

        $this->session_handler = new DbSessionHandler($this, $config);

        $this->check_corpus();
    }

    /**
     * Provide a performance tracker to the Queries object.
     *
     * @param Performance $performance
     */
    public function record_timing($performance)
    {
        $this->performance = $performance;
    }

    /**
     * Mark the start of a query for performance measurement.
     * @param string $query_name
     */
    private function start($query_name)
    {
        if ($this->performance !== NULL) {
            $this->performance->counter($query_name);
            $this->performance->start($query_name);
        }
    }

    /**
     * Record a sql string and bound values for a query.
     * @param string $query_name
     * @param string $sql
     * @param array $valueMap
     */
    private function save_sql($query_name, $sql, $valueMap)
    {
        if ($this->performance !== NULL) {
            $this->performance->sql($query_name, $sql, $valueMap);
        }
    }

    /**
     * Mark the stop of a query for performance measurement.
     * @param string $query_name
     */
    private function stop($query_name)
    {
        if ($this->performance !== NULL) {
            $this->performance->stop($query_name);
        }
    }

    /**
     * Set the timezone to GMT.
     */
    private function set_timezone()
    {
        $this->db->query("set time_zone = '+00:00'");
        if ($this->corpus !== $this->db) {
            $this->corpus->query("set time_zone = '+00:00'");
        }
    }

    /**
     * Set the encoding to utf8mb4
     */
    private function set_encoding()
    {
        $this->db->query('set names utf8mb4');
        if ($this->corpus !== $this->db) {
            $this->corpus->query('set names utf8mb4');
        }
    }

    private function _build_corpus_check()
    {
        $this->prepare('corpus_info',
            "SELECT * FROM corpus_info
             WHERE id=?",
            's',
            $this->corpus
        );

        $this->prepare('corpora',
            "SELECT * FROM corpora
             WHERE id=?",
            's',
            $this->db
        );

        $this->prepare('insert_corpus',
            'INSERT INTO corpora (id, name, created)
            VALUES (?, ?, NOW())',
            'ss',
            $this->db
        );
    }

    private function check_corpus()
    {
        //First make sure the corpus we are connected to is actually the one we think
        //we are connected to.
        $result = $this->run('corpus_info', $this->corpus_id);
        if (!$result || count($result) != 1) {
            echo 'Not connected to corpus ' . $this->corpus_id;
            die();
        }

        //Make sure the corpus is registered in the app db
        $result = $this->run('corpora', $this->corpus_id);
        if (!is_array($result) || count($result) != 1) {
            $this->run('insert_corpus', $this->corpus_id, $this->corpus_id . ' (auto)');
        }
    }

    /**
     * Initialize the prepared statements.
     *
     * This runs all of the methods of the Queries object
     * to find those that start with "_build".
     */
    private function build_queries()
    {
        $this->queries = array();
        $this->types = array();

        // Get all of the query builder methods
        $methods = get_class_methods($this);
        foreach ($methods as $method) {
            if (substr_compare($method, '_build', 0, 6) === 0) {
                call_user_func(array($this, $method));
            }
        }
    }

    /**
     * Prepare a named query. The '$types' parameters should be a MySQLi-style type string,
     * e.g. 'ssii'. Returns FALSE on failure, TRUE on success.
     *
     * @param $queryname
     * @param $querystr
     * @param string $types
     * @param null $db the PDO connection to use, defaults to application database
     * @return bool
     */
    private function prepare($queryname, $querystr, $types = '', $db = NULL)
    {
        if ($db == NULL) {
            $db = $this->db;
        }

        $pdoTypes = array();
        for ($i = 0; $i < strlen($types); $i++) {
            $c = $types[$i];
            $t = PDO::PARAM_STR;
            if ($c === 'i') {
                $t = PDO::PARAM_INT;
            }
            $pdoTypes[] = $t;
        }

        $this->queries[$queryname] = $db->prepare($querystr);
        $this->types[$queryname] = $pdoTypes;

        if (!$this->queries[$queryname]) {
            echo "Prepare ${$queryname} failed: (" . $db->errorCode() . ")";
            print_r($db->errorInfo());
            return FALSE;
        }

        return TRUE;
    }

    /**
     * Execute a query. Expects a query name, MySQLi type string, and list of parameters to bind.
     * @param $query_name
     * @return array
     */
    private function run($query_name)
    {
        $query = $this->queries[$query_name];
        $paramTypes = $this->types[$query_name];

        $this->start($query_name);

        $args = array_slice(func_get_args(), 1);
        if (is_array($args)) {
            foreach ($args as $i => $value) {
                $type = $paramTypes[$i];
                $query->bindValue($i + 1, $value, $type);
            }
        }

        $success = $query->execute();

        if ($success === FALSE) {
            echo "Execute $query_name failed: ({$query->errorCode()})";
            print_r($query->errorInfo());
            print_r($args);
            $query->debugDumpParams();
            $this->stop($query_name);
        } else {
            $result = $query->fetchAll(PDO::FETCH_ASSOC);

            $this->stop($query_name);

            if ($result) {
                return $result;
            } else {
                return TRUE;
            }
        }
    }

    /**
     * @param Builder $builder
     * @param Binder $binder
     * @param null $db the PDO connection to use, defaults to the application db.
     * @return mixed
     */
    private function run2($builder, $binder, $db=NULL)
    {
        if ($db === NULL) {
            $db = $this->db;
        }

        $this->start($builder->name);

        $sql = $builder->sql();

        $this->save_sql($builder->name, $sql, $binder->param_map);

        $query = $db->prepare($sql);

        if (!$query) {
            echo "Prepare {$builder->name} failed: (" . $db->errorCode() . ")";
            print_r($db->errorInfo());
            print_r($sql);
            return FALSE;
        }

        $query = $binder->bind($query);

        if (!$query) {
            echo "Bind for {$builder->name} faild: (" . $db->errorCode() . ")";
            print_r($db->errorInfo());
            print_r($sql);
            print_r($binder->param_map);
            return FALSE;
        }

        $success = $query->execute();

        if ($success === FALSE) {
            echo "Execute {$builder->name} failed: ({$query->errorCode()})";
            print_r($query->errorInfo());
            print_r($builder);

            $this->stop($builder->name);
        } else {
            $result = $query->fetchAll(PDO::FETCH_ASSOC);

            $this->stop($builder->name);

            if ($result) {
                return $result;
            } else {
                return array();
            }
        }
    }

    private function _build_log_action()
    {
        $this->prepare('log_action',
            "INSERT INTO instrumentation (time, ip_address, action, user, data, ref_id, public, corpus)
            VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?)",
            'ssssiis',
            $this->db
        );
    }

    /**
     * Log an action.
     *
     * @param string $action
     * @param object|null $user_data
     * @param string|null $data
     * @param int|null $reference_id
     */
    public function log_action($action, $user_data = NULL, $data = NULL, $reference_id = NULL) {
        if (!$this->logging_enabled) {
            return;
        }

        $ip_address = $_SERVER['REMOTE_ADDR'];

        $user = NULL;
        if ($user_data) {
            $user = $user_data->id;
        }

        $this->run('log_action', $ip_address, $action, $user, $data, $reference_id, $this->public, $this->corpus_id);
    }

    private function _build_insert_annotation()
    {
        $this->prepare('insert_annotation',
            "INSERT INTO annotations (created, user, label, time, public, corpus)
            VALUES (?, ?, ?, ?, ?, ?)",
            'ssssis',
            $this->db
        );
    }

    /**
     * Insert an annotation into the database.
     *
     * @param $user
     * @param $label
     * @param DateTime $datetime
     * @return mixed
     */
    public function insert_annotation($user, $label, $datetime)
    {
        $now = new DateTime('now', $this->utc);
        $created = $now->format('Y-m-d H:i:s');

        $datetime = $datetime->format('Y-m-d H:i:s');

        $this->run('insert_annotation', $created, $user, $label, $datetime, $this->public, $this->corpus_id);
        return $this->db->lastInsertId();
    }

    private function _build_update_annotation()
    {
        $this->prepare('update_annotation',
            "UPDATE annotations SET label = ?
            WHERE user = ? AND id = ?",
            'ssi',
            $this->db
        );
    }

    public function update_annotation($id, $user, $label)
    {
        if ($this->run('update_annotation', $label, $user, $id)) {
            return $id;
        }
    }

    /**
     * Retrieve annotations from the database.
     *
     * @param bool $bursts
     * @return mixed
     */
    public function get_annotations($bursts = FALSE)
    {
        $builder = new Builder('annotations');

        $builder->select('UNIX_TIMESTAMP(a.created) AS created, a.id, a.user, a.label, UNIX_TIMESTAMP(a.time) AS time');
        $builder->select('a.series, a.value');
        $builder->select('app_users.name, app_users.screen_name');
        $builder->from('annotations a');
        $builder->join('app_users', 'a.user = app_users.id', 'left');

        $binder = new Binder();
        $public = $binder->param('public', $this->public, PDO::PARAM_INT);
        $corpus = $binder->param('corpus', $this->corpus_id);

        $builder->where("a.public", "=", $public);
        $builder->where("a.corpus", "=", $corpus);

        if ($bursts) {
            $builder->where('a.series', '!=', '"user"');
        } else {
            $builder->where('a.series', '=', '"user"');
        }

        return $this->run2($builder, $binder, $this->db);
    }

    private function _build_insert_message()
    {
        $this->prepare('insert_message',
            "INSERT INTO messages (created, user, message, view_state, discussion_id)
            VALUES (?, ?, ?, ?, ?)",
            'ssssi',
            $this->db
        );

        $this->prepare('insert_discussion',
            "INSERT INTO discussions (created, public, corpus)
            VALUES (?, ?, ?)",
            'sis',
            $this->db
        );
    }

    /**
     * Gets message for the given discussion. Returns a MySQLi result set object.
     *
     * @param string $user
     * @param string $message
     * @param string $view_state
     * @param int $discussion_id
     * @return int
     */
    public function insert_message($user, $message, $view_state, $discussion_id)
    {
        $now = new DateTime('now', $this->utc);
        $time = $now->format('Y-m-d H:i:s');

        if (!$discussion_id) {
            $this->run('insert_discussion', $time, $this->public, $this->corpus_id);
            $discussion_id = $this->db->lastInsertId();
        }

        $this->run('insert_message', $time, $user, $message, $view_state, $discussion_id);
        return $this->db->lastInsertId();
    }

    private function _build_message()
    {
        $this->prepare('message',
            "SELECT messages.*, UNIX_TIMESTAMP(created) AS created
             FROM messages
             WHERE id = ?",
            'i',
            $this->db
        );
    }

    /**
     * Simply get a message by id. Returns the row.
     *
     * @param $message_id
     * @return array
     */
    public function get_message($message_id)
    {
        $result = $this->run('message', $message_id);

        if (count($result) > 0) {
            $row = $result[0];
            return $row;
        }
    }

    private function _build_user()
    {
        $this->prepare('user',
            "SELECT users.*
             FROM users
             WHERE screen_name = ?",
            's',
            $this->corpus
        );
    }

    /**
     * Get a single user by screen name.
     *
     * @param $screen_name
     * @return mixed
     */
    public function get_user_by_name($screen_name)
    {
        // Chop off a leading @
        if (strlen($screen_name) > 0 && $screen_name[0] == '@') {
            $screen_name = substr($screen_name, 1);
        }

        $result = $this->run('user', $screen_name);

        if (count($result) > 0) {
            $row = $result[0];
            return $row;
        }
    }

    private function _build_discussion_messages()
    {
        $this->prepare('discussion_messages',
            "SELECT messages.*, UNIX_TIMESTAMP(messages.created) AS created,
              app_users.name, app_users.screen_name
            FROM messages
            LEFT JOIN app_users ON messages.user = app_users.id
            WHERE discussion_id = ?
            ORDER BY created DESC",
            'i',
            $this->db
        );
    }

    /**
     * Gets message for the given discussion. Returns a MySQLi result set object.
     *
     * @param int $discussion_id
     *
     * @return mysqli_result
     */
    public function get_discussion_messages($discussion_id)
    {
        $result = $this->run('discussion_messages', $discussion_id);
        return $result;
    }

    /**
     * Gets a list of discussions.
     *
     * @return mysqli_result
     */
    public function get_discussions()
    {
        $builder = new Builder('discussions');

        $builder->select('m.discussion_id AS id');
        $builder->select('COUNT(DISTINCT m.id) AS message_count');
        $builder->select('GROUP_CONCAT(m.message SEPARATOR \'... \') AS subject');
        $builder->select('UNIX_TIMESTAMP(MIN(m.created)) AS started_at');
        $builder->select('UNIX_TIMESTAMP(MAX(m.created)) AS last_comment_at');
        $builder->from('messages m');
        $builder->join('discussions d', 'd.id = m.discussion_id');

        $binder = new Binder();
        $public = $binder->param('public', $this->public);
        $corpus = $binder->param('corpus', $this->corpus_id);

        $builder->where('d.public', '=', $public);
        $builder->where("d.corpus", "=", $corpus);

        $builder->group_by('m.discussion_id');
        $builder->order_by('last_comment_at', 'desc');

        return $this->run2($builder, $binder, $this->db);
    }

    /**
     * Gets a specific tweet
     *
     *
     * @returns the tweet
     */
    public function get_tweet($id)
    {
        $builder = new Builder('tweet');

        $builder->select('tweets.*, UNIX_TIMESTAMP(tweets.created_at) AS created_at, users.screen_name, users.name');
        $builder->from('tweets');
        $builder->join('users', 'users.id = tweets.user_id');
        $binder = new Binder();
        $id = $binder->param('id', $id);

        $builder->where("tweets.id", "=", $id);
        return $this->run2($builder, $binder, $this->corpus);
    }


    /**
     * Gets tweets in the specified interval.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param bool $is_rt whether or not to return retweets or non-retweets
     * @param int $min_rt The minimum retweet count to be returned
     * @param string $text_search
     * @param int $sentiment
     * @param int $user_id
     * @param string $sort
     * @param int $limit
     * @return array
     */
    public function get_tweets($start_datetime, $stop_datetime,
                               $is_rt = NULL, $min_rt = NULL,
                               $text_search = NULL, $sentiment = NULL, $user_id = NULL,
                               $sort = NULL, $limit = NULL)
    {
        $builder = new Builder('tweets');

        $builder->select('tweets.*, UNIX_TIMESTAMP(tweets.created_at) AS created_at, users.screen_name, users.name');
        $builder->from('tweets');
        $builder->join('users', 'users.id = tweets.user_id');

        $builder->order_by($sort, 'desc');
        $builder->limit($limit);

        //Declare the parameters
        $binder = new Binder();
        list($start_datetime, $stop_datetime) = $binder->grouped_created_at_params($start_datetime, $stop_datetime);
        $min_rt = $binder->param('min_rt', $min_rt, PDO::PARAM_INT);
        $is_rt = $binder->param('rt', $is_rt, PDO::PARAM_BOOL);
        $sentiment = $binder->param('sentiment', $sentiment);
        $user_id = $binder->param('user_id', $user_id, PDO::PARAM_INT);

        if ($text_search) {
            $text_search = "%$text_search%";
        }
        $text_search = $binder->param('search', $text_search);

        $builder->where_grouped_created_at_between($start_datetime, $stop_datetime);
        $builder->where_retweet_count_over($min_rt);
        $builder->where_text_like($text_search);
        $builder->where_is_retweet_is($is_rt);
        $builder->where_user_is($user_id);
        $builder->where_sentiment_is($sentiment);

        return $this->run2($builder, $binder, $this->corpus);
    }

    /**
     * Query to generate users list.
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param bool $is_rt
     * @param int $min_rt
     * @param string $text_search
     * @param int $sentiment
     * @param int $user_id
     * @param string $sort
     * @param int $limit
     * @return mixed
     */
    public function get_users_list($start_datetime, $stop_datetime,
                                   $is_rt = NULL, $min_rt = NULL,
                                   $text_search = NULL, $sentiment = NULL, $user_id = NULL,
                                   $sort = NULL, $limit = NULL)
    {
        $subquery = new Builder('users_subquery');
        $subquery->select('tweets.user_id AS id, tweets.followers_count AS followers, COUNT(DISTINCT tweets.id) AS count');
        $subquery->from('tweets');
        $subquery->group_by('tweets.user_id');
        $subquery->order_by($sort, 'DESC');
        $subquery->limit($limit);

        //Declare the parameters
        $binder = new Binder();
        list($start_datetime, $stop_datetime) = $binder->grouped_created_at_params($start_datetime, $stop_datetime);
        $min_rt = $binder->param('min_rt', $min_rt, PDO::PARAM_INT);
        $is_rt = $binder->param('rt', $is_rt, PDO::PARAM_BOOL);
        $user_id = $binder->param('user_id', $user_id, PDO::PARAM_INT);
        $sentiment = $binder->param('sentiment', $sentiment);
        if ($text_search) {
            $text_search = "%$text_search%";
        }
        $text_search = $binder->param('search', $text_search);

        $subquery->where_grouped_created_at_between($start_datetime, $stop_datetime);
        $subquery->where_retweet_count_over($min_rt);
        $subquery->where_text_like($text_search);
        $subquery->where_is_retweet_is($is_rt);
        $subquery->where_user_is($user_id);
        $subquery->where_sentiment_is($sentiment);

        $builder = new Builder('users');
        $builder->select('subquery.*, users.screen_name, users.name');
        $builder->from('users');
        $builder->from("({$subquery->sql()}) AS subquery");
        $builder->where('users.id', '=', 'subquery.id');

        return $this->run2($builder, $binder, $this->corpus);
    }

    /**
     * Counts tweets in the specified interval, grouped by time. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @param bool $split_sentiment
     * @param bool $is_rt
     * @param int $min_rt
     * @param string $text_search
     * @param int $sentiment
     * @param int $user_id
     * @return array
     */
    public function get_grouped_counts($start_datetime, $stop_datetime, $group_seconds, $split_sentiment = TRUE,
                                       $is_rt = NULL, $min_rt = NULL,
                                       $text_search = NULL, $sentiment = NULL, $user_id = NULL)
    {

        //Declare some parameters we need now
        $binder = new Binder();
        list($start_datetime, $stop_datetime) = $binder->grouped_created_at_params($start_datetime, $stop_datetime, $group_seconds);
        $group_seconds = $binder->param('interval', $group_seconds, PDO::PARAM_INT);

        $builder = new Builder('grouped_counts');
        $builder->select("$group_seconds * created_at_5s AS binned_time");
        $builder->select('COUNT(*) AS count');
        if ($split_sentiment) {
            $builder->select('SUM(IF(sentiment=1,1,0)) AS positive');
            $builder->select('SUM(IF(sentiment=0,1,0)) AS neutral');
            $builder->select('SUM(IF(sentiment=-1,1,0)) AS negative');
        }

        $builder->from('tweets');

        $builder->group_by('created_at_5s');
        $builder->order_by('created_at_5s');

        //Declare the rest of the parameters
        $min_rt = $binder->param('min_rt', $min_rt, PDO::PARAM_INT);
        $is_rt = $binder->param('rt', $is_rt, PDO::PARAM_BOOL);
        $sentiment = $binder->param('sentiment', $sentiment);
        $user_id = $binder->param('user_id', $user_id, PDO::PARAM_INT);
        if ($text_search) {
            $text_search = "%$text_search%";
        }
        $text_search = $binder->param('search', $text_search);

        $builder->where_grouped_created_at_between($start_datetime, $stop_datetime);
        $builder->where_retweet_count_over($min_rt);
        $builder->where_text_like($text_search);
        $builder->where_is_retweet_is($is_rt);
        $builder->where_user_is($user_id);
        $builder->where_sentiment_is($sentiment);

        return $this->run2($builder, $binder, $this->corpus);
    }

    /**
     * Grabs the top burst keywords
     *
     * @param int $window_size in seconds (should be 300 or 1200)
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $limit
     * @return array
     */
    public function get_burst_keywords($window_size, $start_datetime, $stop_datetime, $limit = 10)
    {
        //Compute an extended interval, by the window size
        $half_window_size = $window_size / 2;
        $window_interval = new DateInterval("PT{$half_window_size}S");
        $start_datetime->sub($window_interval);
        $stop_datetime->add($window_interval);

        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $builder = new Builder('burst_keywords');
        $builder->select('*, UNIX_TIMESTAMP(mid_point) AS mid_point');
        $builder->from('burst_keywords');
        $builder->order_by('count_percent_delta', 'DESC');
        $builder->limit($limit);

        //Declare the parameters
        $binder = new Binder();
        $start_datetime = $binder->param('from', $start_datetime);
        $stop_datetime = $binder->param('from', $stop_datetime);

        //Set the conditions
        $builder->where('mid_point', '>=', $start_datetime);
        $builder->where('mid_point', '<', $stop_datetime);

        return $this->run2($builder, $binder, $this->corpus);
    }

    public function get_session($id)
    {
        $binder = new Binder();
        $id = $binder->param('id', $id);

        $builder = new Builder('get_session');
        $builder->select('*');
        $builder->from('sessions');
        $builder->where('id', '=', $id);
        $builder->limit(1);

        $result = $this->run2($builder, $binder, $this->db);

        if ($result) {
            return $result[0];
        }
    }


    private function _build_sessions()
    {
        $this->prepare('save_session',
            "REPLACE INTO sessions
            (id, access, data)
            VALUES (?, ?, ?)",
            'sis',
            $this->db
        );

        $this->prepare('delete_session',
            "DELETE FROM sessions
            WHERE id = ?",
            's',
            $this->db
        );

        $this->prepare('delete_old_sessions',
            'DELETE FROM sessions
            WHERE access < ?',
            'i',
            $this->db
        );
    }
    public function save_session($id, $data)
    {
        $access = time();
        return $this->run('save_session', $id, $access, $data);
    }

    public function delete_session($id)
    {
        return $this->run('delete_session', $id);
    }

    public function clean_sessions($max_lifetime)
    {
        $old = time() - $max_lifetime;
        return $this->run('delete_old_sessions', $old);
    }


    private function _build_app_users()
    {
        $this->prepare('save_app_user',
            "INSERT INTO app_users
            (created, twitter_id, screen_name, name, utc_offset, time_zone)
            VALUES (NOW(), ?, ?, ?, ?, ?)",
            'issis',
            $this->db
        );

        $this->prepare('update_app_user',
            "UPDATE app_users
            SET screen_name=?,
                name=?,
                utc_offset=?,
                time_zone=?
            WHERE id=?",
            'ssisi',
            $this->db
        );

        $this->prepare('sign_in_user',
            "UPDATE app_users
            SET last_signed_in = NOW()
            WHERE id=?",
            'i',
            $this->db
        );
    }
    /**
     * Get or create an app user record for the provided twitter user.
     *
     * @param stdClass $twitter_user
     * @return int
     */
    public function get_app_user_id($twitter_user) {

        $twitter_id = $twitter_user->id;

        $binder = new Binder();
        $twitter_id_param = $binder->param('twitter_id', $twitter_id, PDO::PARAM_INT);

        $builder = new Builder('get_app_user_id');
        $builder->select('id');
        $builder->from('app_users');
        $builder->where('twitter_id', '=', $twitter_id_param);
        $builder->limit(1);

        $result = $this->run2($builder, $binder, $this->db);

        if ($result) {
            $id =$result[0]['id'];

            //Create a new user record
            $screen_name = $twitter_user->screen_name;
            $name = $twitter_user->name;
            $utc_offset = NULL;
            if (isset($twitter_user->utc_offset)) {
                $utc_offset = $twitter_user->utc_offset;
            }
            $time_zone = NULL;
            if (isset($twitter_user->time_zone)) {
                $time_zone = $twitter_user->time_zone;
            }

            $this->run('update_app_user', $screen_name, $name, $utc_offset, $time_zone, $id);

            return $id;
        } else {
            //Create a new user record
            $screen_name = $twitter_user->screen_name;
            $name = $twitter_user->name;
            $utc_offset = NULL;
            if (isset($twitter_user->utc_offset)) {
                $utc_offset = $twitter_user->utc_offset;
            }
            $time_zone = NULL;
            if (isset($twitter_user->time_zone)) {
                $time_zone = $twitter_user->time_zone;
            }

            $this->run('save_app_user', $twitter_id, $screen_name, $name, $utc_offset, $time_zone);
            return $this->db->lastInsertId();
        }
    }

    public function get_app_user($id, $sign_in=FALSE) {
        $binder = new Binder();
        $id = $binder->param('id', $id);

        $builder = new Builder('get_app_user');
        $builder->select('*');
        $builder->from('app_users');
        $builder->where('id', '=', $id);
        $builder->limit(1);

        $result = $this->run2($builder, $binder, $this->db);

        if ($result) {
            if ($sign_in === TRUE) {
                $this->run('sign_in_user', $id);
            }

            return $result[0];
        }
    }
}

/**
 * Converts an array of values into references.
 *
 * http://php.net/manual/en/mysqli-stmt.bind-param.php
 *
 * @param array $arr
 * @return array
 */
function refValues($arr)
{
    if (strnatcmp(phpversion(), '5.3') >= 0) //Reference is required for PHP 5.3+
    {
        $refs = array();
        foreach ($arr as $key => $value)
            $refs[$key] = & $arr[$key];
        return $refs;
    }
    return $arr;
}
