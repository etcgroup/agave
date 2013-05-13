<?php

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
    private $queries;
    private $types;
    private $originals;
    private $performance = NULL;
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
     * @param type $query_name
     */
    private function start($query_name)
    {
        if ($this->performance !== NULL) {
            $this->performance->counter($query_name);
            $this->performance->start($query_name);
        }
    }

    /**
     * Mark the stop of a query for performance measurement.
     * @param type $query_name
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
        $this->queries = new stdClass();
        $this->types = new stdClass();

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
    private function prepare($queryname, $querystr, $types='') {
        $pdoTypes = array();
        for ($i = 0; $i < strlen($types); $i++) {
            $c = $types[$i];
            $t = PDO::PARAM_STR;
            if ($c === 'i') {
                $t = PDO::PARAM_INT;
            }
            $pdoTypes[] = $t;
        }

        $this->queries->{$queryname} = $this->db->prepare($querystr);
        $this->types->{$queryname} = $pdoTypes;

        if (!$this->queries->{$queryname}) {
            echo "Prepare ${$queryname} failed: (" . $this->db->errorCode() . ")";
            print_r($this->db->errorInfo());
            return FALSE;
        }

        return TRUE;
    }

    /**
     * Execute a query. Expects a query name, MySQLi type string, and list of parameters to bind.
     * @param string $queryname
     * @return array
     */
    private function run($queryname)
    {
        $query = $this->queries->{$queryname};
        $paramTypes = $this->types->{$queryname};

        $this->start($queryname);

        $args = array_slice(func_get_args(), 1);
        if ($args) {
            foreach ($args as $i=>$value) {
                $type = $paramTypes[$i];
                $query->bindValue($i + 1, $value, $type);
            }
        }

        $success = $query->execute();

        if ($success === FALSE) {
            echo "Execute $queryname failed: ({$query->errorCode()})";
            print_r($query->errorInfo());
            print_r($args);
            $query->debugDumpParams();
            $this->stop($queryname);
        } else {
            $result = $query->fetchAll(PDO::FETCH_ASSOC);

            $this->stop($queryname);

            if ($result) {
                return $result;
            } else {
                return TRUE;
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
     * @param $datetime
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

    private function _build_annotations() {
        $this->prepare('annotations',
            "SELECT UNIX_TIMESTAMP(created) as created,
            id, user, label,
            UNIX_TIMESTAMP(time) as time
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
            "SELECT id, discussion_id, UNIX_TIMESTAMP(created) as created, user, message
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
    public function get_message($message_id) {
        $result = $this->run('message', $message_id);

        if (count($result) > 0) {
            $row = $result[0];
            return $row;
        }
    }

    private function _build_discussion_messages()
    {
        $this->prepare('discussion_messages',
            "SELECT id, discussion_id, UNIX_TIMESTAMP(created) as created, user, message
            FROM messages
            WHERE discussion_id = ?
            ORDER BY created desc",
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
                COUNT(*) as message_count,
                GROUP_CONCAT(DISTINCT user ORDER BY created DESC SEPARATOR ', ') AS users,
                GROUP_CONCAT(message SEPARATOR '... ') as subject,
                UNIX_TIMESTAMP(MIN(created)) AS started_at,
                UNIX_TIMESTAMP(MAX(created)) AS last_comment_at
            FROM messages
            GROUP BY discussion_id
            ORDER BY last_comment_at desc;"
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

    private function _build_originals()
    {
        $base_query = "SELECT t.*, UNIX_TIMESTAMP(t.created_at) AS created_at, u.screen_name
            FROM tweets t
            INNER JOIN users u on u.id = t.user_id
            WHERE NOT t.is_retweet
            AND t.created_at >= ?
            AND t.created_at < ?
            AND t.retweet_count >= ?
            ORDER BY t.%s desc
            LIMIT ?";

        $base_query_like = "SELECT t.*, UNIX_TIMESTAMP(t.created_at) AS created_at, u.screen_name
            FROM tweets t
            INNER JOIN users u on u.id = t.user_id
            WHERE NOT t.is_retweet
            AND t.created_at >= ?
            AND t.created_at < ?
            AND t.retweet_count >= ?
            AND t.text LIKE ?
            ORDER BY t.%s desc
            LIMIT ?";


        $this->prepare('originals',
            sprintf($base_query, 'created_at'),
            'ssii'
        );

        $this->prepare('originals_like',
            sprintf($base_query_like, 'created_at'),
            'ssisi'
        );

        /* sorted by retweet count */
        $this->prepare('originals_orderby_retweet',
            sprintf($base_query, 'retweet_count'),
            'ssii'
        );

        $this->prepare('originals_like_orderby_retweet',
            sprintf($base_query_like, 'retweet_count'),
            'ssisi'
        );

    }


    /**
     * Gets tweets in the specified interval. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $limit
     * @param int $noise_threshold The minimum retweet count to be returned
     * @param string $text_search
     * @param string $sort
     * @return mysqli_result
     */
    public function get_originals($start_datetime, $stop_datetime, $limit, $noise_threshold, $text_search = NULL, $sort = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $limit = (int)$limit;
        if ($text_search === NULL) {
            $query_name = 'originals';
            if($sort == 'retweet_count') {
                $query_name .= '_orderby_retweet';
            }
            $result = $this->run($query_name, $start_datetime,
                $stop_datetime, $noise_threshold, $limit);
        } else {
            $query_name = 'originals_like';
            if($sort == 'retweet_count') {
                $query_name .= '_orderby_retweet';
            }
            $search = "%$text_search%";
            $result = $this->run($query_name, $start_datetime,
                $stop_datetime, $noise_threshold, $search, $limit);
        }
        return $result;
    }

    private function _build_grouped_originals()
    {
        $this->prepare('grouped_originals',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count,
                SUM(IF(sentiment=1,1,0)) AS positive,
                SUM(IF(sentiment=0,1,0)) AS neutral,
                SUM(IF(sentiment=-1,1,0)) AS negative
            FROM tweets
            WHERE NOT is_retweet
            AND created_at >= ?
            AND created_at < ?
            AND retweet_count >= ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisissi'
        );

        $this->prepare('grouped_originals_like',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count,
                SUM(IF(sentiment=1,1,0)) AS positive,
                SUM(IF(sentiment=0,1,0)) AS neutral,
                SUM(IF(sentiment=-1,1,0)) AS negative
            FROM tweets
            WHERE NOT is_retweet
            AND created_at >= ?
            AND created_at < ?
            AND retweet_count >= ?
            AND text LIKE ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisissis'
        );
    }

    /**
     * Counts tweets in the specified interval, grouped by time. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @param int $noise_threshold The minimum retweet count to be returned.
     * @param string $text_search
     * @return mysqli_result
     */
    public function get_grouped_originals($start_datetime, $stop_datetime, $group_seconds, $noise_threshold, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL) {
            $result = $this->run('grouped_originals',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $noise_threshold);
        } else {
            $search = "%$text_search%";
            $result = $this->run('grouped_originals_like',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $noise_threshold, $search);
        }


        return $result;
    }

    private function _build_grouped_retweets()
    {
        $this->prepare('grouped_retweets',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count
            FROM tweets
            WHERE is_retweet
            AND created_at >= ?
            AND created_at < ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisiss'
        );

        $this->prepare('grouped_retweets_like',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count
            FROM tweets
            WHERE is_retweet
            AND created_at >= ?
            AND created_at < ?
            AND text LIKE ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisisss'
        );
    }

    /**
     * Get retweet counts grouped over a time interval.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @param string $text_search
     * @return mysqli_result
     */
    public function get_grouped_retweets($start_datetime, $stop_datetime, $group_seconds, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL) {
            $result = $this->run('grouped_retweets', $start_datetime,
                $group_seconds, $start_datetime, $group_seconds,
                $start_datetime, $stop_datetime);
        } else {
            $search = "%$text_search%";
            $result = $this->run('grouped_retweets_like',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime, $search);
        }

        return $result;
    }

    private function _build_grouped_retweets_of_id()
    {
        $this->prepare('grouped_retweets_of_id',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count
            FROM tweets
            WHERE is_retweet
            AND created_at >= ?
            AND created_at < ?
            AND retweet_of_status_id = ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisisss'
        );

    }

    /**
     * Get retweet counts of a specific tweet, grouped over a time interval.
     *
     * @param long $tweet_id
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @return mysqli_result
     */
    public function get_grouped_retweets_of_id($tweet_id, $start_datetime, $stop_datetime, $group_seconds)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $result = $this->run('grouped_retweets_of_id',
            $start_datetime, $group_seconds, $start_datetime,
            $group_seconds, $start_datetime, $stop_datetime, $tweet_id);

        return $result;
    }

    private function _build_grouped_retweets_of_range()
    {
        $this->prepare('grouped_retweets_of_range',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(rt.created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count,
                SUM(IF(rt.sentiment=1,1,0)) AS positive,
                SUM(IF(rt.sentiment=0,1,0)) AS neutral,
                SUM(IF(rt.sentiment=-1,1,0)) AS negative
            FROM tweets t0, tweets rt
            WHERE t0.id = rt.retweet_of_status_id
            AND rt.created_at >= ?
            AND rt.created_at < ?
            AND t0.created_at >= ?
            AND t0.created_at < ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisissss'
        );

    }

    /**
     * Get retweet counts of tweets in an interval, grouped over another time interval.
     *
     * @param DateTime $tweets_start_datetime
     * @param DateTime $tweets_stop_datetime
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @return mysqli_result
     */
    public function get_grouped_retweets_of_range($tweets_start_datetime, $tweets_stop_datetime, $start_datetime, $stop_datetime, $group_seconds)
    {
        $tweets_start_datetime = $tweets_start_datetime->format('Y-m-d H:i:s');
        $tweets_stop_datetime = $tweets_stop_datetime->format('Y-m-d H:i:s');

        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $result = $this->run('grouped_retweets_of_range',
            $start_datetime, $group_seconds, $start_datetime,
            $group_seconds, $start_datetime, $stop_datetime,
            $tweets_start_datetime, $tweets_stop_datetime);

        return $result;
    }

    private function _build_grouped_noise()
    {
        $this->prepare('grouped_noise',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count
            FROM tweets
            WHERE NOT is_retweet
            AND created_at >= ?
            AND created_at < ?
            AND retweet_count < ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisissi'
        );

        $this->prepare('grouped_noise_like',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count
            FROM tweets
            WHERE NOT is_retweet
            AND created_at >= ?
            AND created_at < ?
            AND retweet_count < ?
            AND text LIKE ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisissis'
        );
    }

    /**
     * Gets noise tweets in the specified interval. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds The bin size in seconds
     * @param int $noise_threshold The maximum retweet count to return.
     * @param string $text_search Optional text search
     * @return mysqli_result
     */
    public function get_grouped_noise($start_datetime, $stop_datetime, $group_seconds, $noise_threshold, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL) {
            $result = $this->run('grouped_noise', $start_datetime,
                $group_seconds, $start_datetime, $group_seconds,
                $start_datetime, $stop_datetime, $noise_threshold);
        } else {
            $search = "%$text_search%";
            $result = $this->run('grouped_noise_like',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $noise_threshold, $search);
        }

        return $result;
    }

    private function _build_grouped_counts()
    {
        $this->prepare('grouped_counts',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count
            FROM tweets
            WHERE created_at >= ?
            AND created_at < ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisiss'
        );
    }

    /**
     * Count tweets in the specified interval. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds The bin size in seconds
     * @return mysqli_result
     */
    public function get_grouped_counts($start_datetime, $stop_datetime, $group_seconds)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $result = $this->run('grouped_counts', $start_datetime,
            $group_seconds, $start_datetime, $group_seconds,
            $start_datetime, $stop_datetime);
        return $result;
    }

    private function _build_users_list()
    {
        $this->prepare('users_list',
                "SELECT subquery.*, u.screen_name
                from users u,
                (SELECT t.user_id as id, count(t.user_id) as count
                from tweets t
                where t.created_at >= ? and t.created_at < ?
                group by user_id
                order by count desc
                limit 50) as subquery
                where u.id = subquery.id",
                'ss'
                );
        
    }
    
    // query to generate users list
    public function get_users_list($start_datetime, $stop_datetime) 
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');
        
        $result = $this->run('users_list', $start_datetime, $stop_datetime);
        return $result;
    }
    
    
    
    private function _build_grouped_counts_filtered()
    {
        $this->prepare('grouped_counts_filtered',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count,
                SUM(IF(sentiment=1,1,0)) AS positive,
                SUM(IF(sentiment=0,1,0)) AS neutral,
                SUM(IF(sentiment=-1,1,0)) AS negative
            FROM tweets
            WHERE created_at >= ?
            AND created_at < ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisiss'
        );


        $this->prepare('grouped_counts_filtered_like',
            "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                COUNT(*) as count,
                SUM(IF(sentiment=1,1,0)) AS positive,
                SUM(IF(sentiment=0,1,0)) AS neutral,
                SUM(IF(sentiment=-1,1,0)) AS negative
            FROM tweets
            WHERE created_at >= ?
            AND created_at < ?
            AND text LIKE ?
            GROUP BY binned_time
            ORDER BY binned_time",
            'sisisss'
        );

    }

    /**
     * Counts tweets in the specified interval, grouped by time. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @param string $text_search
     * @return mysqli_result
     */
    public function get_grouped_counts_filtered($start_datetime, $stop_datetime, $group_seconds, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL) {
            $result = $this->run('grouped_counts_filtered',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime);
        } else {
            $search = "%$text_search%";
            $result = $this->run('grouped_counts_filtered_like',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $search);
        }

        return $result;
    }
}

/**
 * Converts an array of values into references.
 *
 * http://php.net/manual/en/mysqli-stmt.bind-param.php
 *
 * @param type $arr
 * @return type
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
