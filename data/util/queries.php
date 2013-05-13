<?php

include_once 'builder.php';
include_once 'binder.php';

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

    private $db;
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
     * $params may either be an associative array containing 'host', 'port', 'user', 'password', and 'schema'
     * or it may be the string name of a .ini file containing those variables.
     *
     * If $params is not provided, 'db.ini' will be searched for parameters.
     *
     * @param mixed $params
     */
    public function __construct($params = NULL)
    {
        $this->utc = new DateTimeZone('UTC');

        if ($params === NULL) {
            $params = parse_ini_file('db.ini');
        } else if (is_string($params)) {
            $params = parse_ini_file($params);
        } else if (!is_array($params)) {
            print "No DB params";
            die();
        }

        if (!array_key_exists('port', $params)) {
            $params['port'] = 3306;
        }

        $pdo_string = "mysql:host=${params['host']};dbname=${params['schema']};port=${params['port']}";

        //Create a persistent PDO connection
        $this->db = new PDO($pdo_string, $params['user'], $params['password'], array(
            PDO::ATTR_PERSISTENT => true
        ));

        $this->build_queries();
        $this->set_timezone();
        $this->set_encoding();
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
    }

    /**
     * Set the encoding to utf8mb4
     */
    private function set_encoding()
    {
        $this->db->query('set names utf8mb4');
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
     * @return bool
     */
    private function prepare($queryname, $querystr, $types = '')
    {
        $pdoTypes = array();
        for ($i = 0; $i < strlen($types); $i++) {
            $c = $types[$i];
            $t = PDO::PARAM_STR;
            if ($c === 'i') {
                $t = PDO::PARAM_INT;
            }
            $pdoTypes[] = $t;
        }

        $this->queries[$queryname] = $this->db->prepare($querystr);
        $this->types[$queryname] = $pdoTypes;

        if (!$this->queries[$queryname]) {
            echo "Prepare ${$queryname} failed: (" . $this->db->errorCode() . ")";
            print_r($this->db->errorInfo());
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
        if ($args) {
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
     * @return mixed
     */
    private function run2($builder, $binder)
    {
        $this->start($builder->name);

        $sql = $builder->sql();

        $this->save_sql($builder->name, $sql, $binder->param_map);

        $query = $this->db->prepare($sql);

        if (!$query) {
            echo "Prepare {$builder->name} failed: (" . $this->db->errorCode() . ")";
            print_r($this->db->errorInfo());
            print_r($sql);
            return FALSE;
        }

        $query = $binder->bind($query);

        if (!$query) {
            echo "Bind for {$builder->name} faild: (" . $this->db->errorCode() . ")";
            print_r($this->db->errorInfo());
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

    private function _build_insert_annotation()
    {
        $this->prepare('insert_annotation',
            "INSERT INTO annotations (created, user, label, time)
            VALUES (?, ?, ?, ?)",
            'ssss'
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

        $this->run('insert_annotation', $created, $user, $label, $datetime);
        return $this->db->lastInsertId();
    }

    private function _build_annotations()
    {
        $this->prepare('annotations',
            "SELECT UNIX_TIMESTAMP(created) AS created,
            id, user, label,
            UNIX_TIMESTAMP(time) AS time
            FROM annotations"
        );

    }

    /**
     * Retrieve annotations from the database.
     *
     * @return mixed
     */
    public function get_annotations()
    {
        return $this->run('annotations');
    }

    private function _build_insert_message()
    {
        $this->prepare('insert_message',
            "INSERT INTO messages (created, user, message, discussion_id)
            VALUES (?, ?, ?, ?)",
            'sssi'
        );

        $this->prepare('insert_discussion',
            "INSERT INTO discussions (created)
            VALUES (?)",
            's'
        );
    }

    /**
     * Gets message for the given discussion. Returns a MySQLi result set object.
     *
     * @param string $user
     * @param string $message
     * @param int $discussion_id
     * @return mysqli_result
     */
    public function insert_message($user, $message, $discussion_id)
    {
        $now = new DateTime('now', $this->utc);
        $time = $now->format('Y-m-d H:i:s');

        if (!$discussion_id) {
            $this->run('insert_discussion', $time);
            $discussion_id = $this->db->lastInsertId();
        }

        $this->run('insert_message', $time, $user, $message, $discussion_id);
        return $this->db->lastInsertId();
    }

    private function _build_message()
    {
        $this->prepare('message',
            "SELECT id, discussion_id, UNIX_TIMESTAMP(created) AS created, user, message
             FROM messages
             WHERE id = ?",
            'i'
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
            's'
        );
    }

    /**
     * Get a single user by screen name.
     *
     * @param $screen_name
     * @return mixed
     */
    public function get_user_by_name($screen_name) {
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
            "SELECT id, discussion_id, UNIX_TIMESTAMP(created) AS created, user, message
            FROM messages
            WHERE discussion_id = ?
            ORDER BY created DESC",
            'i'
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

    private function _build_discussions()
    {
        $this->prepare('discussions',
            "SELECT discussion_id AS id,
                COUNT(*) AS message_count,
                GROUP_CONCAT(DISTINCT user ORDER BY created DESC SEPARATOR ', ') AS users,
                GROUP_CONCAT(message SEPARATOR '... ') AS subject,
                UNIX_TIMESTAMP(MIN(created)) AS started_at,
                UNIX_TIMESTAMP(MAX(created)) AS last_comment_at
            FROM messages
            GROUP BY discussion_id
            ORDER BY last_comment_at DESC;"
        );

    }

    /**
     * Gets a list of discussions.
     *
     * @return mysqli_result
     */
    public function get_discussions()
    {
        $result = $this->run('discussions');
        return $result;
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
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $builder = new Builder('tweets');

        $builder->select('tweets.*, UNIX_TIMESTAMP(tweets.created_at) AS created_at, users.screen_name');
        $builder->from('tweets');
        $builder->join('users', 'users.id = tweets.user_id');

        $builder->order_by($sort, 'desc');
        $builder->limit($limit);

        //Declare the parameters
        $binder = new Binder();
        $start_datetime = $binder->param('from', $start_datetime);
        $stop_datetime = $binder->param('to', $stop_datetime);
        $min_rt = $binder->param('min_rt', $min_rt, PDO::PARAM_INT);
        $is_rt = $binder->param('rt', $is_rt, PDO::PARAM_BOOL);
        $sentiment = $binder->param('sentiment', $sentiment);
        $user_id = $binder->param('user_id', $user_id, PDO::PARAM_INT);

        if ($text_search) {
            $text_search = "%$text_search%";
        }
        $text_search = $binder->param('search', $text_search);

        $builder->where_created_at_between($start_datetime, $stop_datetime);
        $builder->where_retweet_count_over($min_rt);
        $builder->where_text_like($text_search);
        $builder->where_is_retweet_is($is_rt);
        $builder->where_user_is($user_id);
        $builder->where_sentiment_is($sentiment);

        return $this->run2($builder, $binder);
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
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $subquery = new Builder('users_subquery');
        $subquery->select('tweets.user_id AS id, COUNT(tweets.user_id) AS count');
        $subquery->from('tweets');
        $subquery->group_by('tweets.user_id');
        $subquery->order_by($sort, 'DESC');
        $subquery->limit($limit);

        //Declare the parameters
        $binder = new Binder();
        $start_datetime = $binder->param('from', $start_datetime);
        $stop_datetime = $binder->param('to', $stop_datetime);
        $min_rt = $binder->param('min_rt', $min_rt, PDO::PARAM_INT);
        $is_rt = $binder->param('rt', $is_rt, PDO::PARAM_BOOL);
        $sentiment = $binder->param('sentiment', $sentiment);
        if ($text_search) {
            $text_search = "%$text_search%";
        }
        $text_search = $binder->param('search', $text_search);

        $subquery->where_created_at_between($start_datetime, $stop_datetime);
        $subquery->where_retweet_count_over($min_rt);
        $subquery->where_text_like($text_search);
        $subquery->where_is_retweet_is($is_rt);
        $subquery->where_sentiment_is($sentiment);

        $builder = new Builder('users');
        $builder->select('subquery.*, users.screen_name');
        $builder->from('users');
        $builder->from("({$subquery->sql()}) AS subquery");
        $builder->where('users.id', '=', 'subquery.id');

        return $this->run2($builder, $binder);
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
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        //Declare some parameters we need now
        $binder = new Binder();
        $start_datetime = $binder->param('from', $start_datetime);
        $group_seconds = $binder->param('interval', $group_seconds, PDO::PARAM_INT);

        $builder = new Builder('grouped_counts');

        $builder->select("UNIX_TIMESTAMP($start_datetime) + $group_seconds * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP($start_datetime)) / $group_seconds) AS binned_time");
        $builder->select('COUNT(*) AS count');
        if ($split_sentiment) {
            $builder->select('SUM(IF(sentiment=1,1,0)) AS positive');
            $builder->select('SUM(IF(sentiment=0,1,0)) AS neutral');
            $builder->select('SUM(IF(sentiment=-1,1,0)) AS negative');
        }

        $builder->from('tweets');

        $builder->group_by('binned_time');
        $builder->order_by('binned_time');

        //Declare the rest of the parameters
        $stop_datetime = $binder->param('to', $stop_datetime);
        $min_rt = $binder->param('min_rt', $min_rt, PDO::PARAM_INT);
        $is_rt = $binder->param('rt', $is_rt, PDO::PARAM_BOOL);
        $sentiment = $binder->param('sentiment', $sentiment);
        $user_id = $binder->param('user_id', $user_id, PDO::PARAM_INT);
        if ($text_search) {
            $text_search = "%$text_search%";
        }
        $text_search = $binder->param('search', $text_search);

        $builder->where_created_at_between($start_datetime, $stop_datetime);
        $builder->where_retweet_count_over($min_rt);
        $builder->where_text_like($text_search);
        $builder->where_is_retweet_is($is_rt);
        $builder->where_user_is($user_id);
        $builder->where_sentiment_is($sentiment);

        return $this->run2($builder, $binder);
    }


    /**
     * Grabs the keyword terms
     *
     *
     *
     *
     *
     *
     */
    private function _build_burst_keywords()
    {
        $this->prepare('burst_keywords',
            "SELECT * FROM burst_keywords 
            WHERE window_size=?
            AND ((UNIX_TIMESTAMP(mid_point)+ window_size/2 >= UNIX_TIMESTAMP(?) AND UNIX_TIMESTAMP(mid_point) + window_size/2 <= UNIX_TIMESTAMP(?))
            OR (UNIX_TIMESTAMP(mid_point)- window_size/2 >= UNIX_TIMESTAMP(?) AND UNIX_TIMESTAMP(mid_point) - window_size/2 <= UNIX_TIMESTAMP(?)))
            ORDER BY COUNT_PERCENT_DELTA DESC 
            LIMIT ?
            ",
            'issssi'
        );


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
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $limit = (int)$limit;
        $result = $this->run('burst_keywords',
            $window_size, $start_datetime, $stop_datetime, $start_datetime, $stop_datetime, $limit);

        return $result;
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
