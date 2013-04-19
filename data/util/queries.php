<?php

//http://php.net/manual/en/mysqli-stmt.bind-param.php
function refValues($arr)
{
    if (strnatcmp(phpversion(), '5.3') >= 0) //Reference is required for PHP 5.3+
    {
        $refs = array();
        foreach ($arr as $key => $value)
            $refs[$key] = &$arr[$key];
        return $refs;
    }
    return $arr;
}

class Queries {

    private $db;
    private $queries;
    private $originals;
    private $performance = NULL;

    /**
     * Construct a new Queries object.
     *
     * $params may either be an associative array containing 'host', 'user', 'password', and 'schema'
     * or it may be the string name of a .ini file containing those variables.
     *
     * @param mixed $params
     */
    public function __construct($params = NULL)
    {
        if (is_string($params))
        {
            $params = parse_ini_file('db.ini');
        }
        else if (!is_array($params))
        {
            print "No DB params";
            die();
        }

        $this->db = new mysqli($params['host'],
                        $params['user'],
                        $params['password'],
                        $params['schema']);
        $this->build_queries();
        $this->set_timezone();
        $this->set_encoding();
    }

    /**
     * Record performance using the given tracker.
     * @param Performance $performance
     */
    public function record_timing($performance)
    {
        $this->performance = $performance;
    }

    private function start($query_name)
    {
        if ($this->performance !== NULL)
        {
            $this->performance->counter($query_name);
            $this->performance->start($query_name);
        }
    }

    private function stop($query_name)
    {
        if ($this->performance !== NULL)
        {
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
     */
    private function build_queries()
    {
        $this->queries = new stdClass();

        $this->queries->originals = $this->db->prepare(
                "SELECT *
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND retweet_count > ?
                ORDER BY created_at
                LIMIT ?"
        );
        if (!$this->queries->originals)
        {
            echo "Prepare originals failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->originals_like = $this->db->prepare(
                "SELECT *
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND retweet_count > ?
                AND text LIKE ?
                ORDER BY created_at
                LIMIT ?"
        );
        if (!$this->queries->originals_like)
        {
            echo "Prepare originals_like failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_originals = $this->db->prepare(
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
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_originals)
        {
            echo "Prepare grouped_originals failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_originals_like = $this->db->prepare(
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
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_originals_like)
        {
            echo "Prepare grouped_originals_like failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_retweets = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count
                FROM tweets
                WHERE is_retweet
                AND created_at >= ?
                AND created_at < ?
                GROUP BY binned_time
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_retweets)
        {
            echo "Prepare grouped_retweets failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_retweets_like = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count
                FROM tweets
                WHERE is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND text LIKE ?
                GROUP BY binned_time
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_retweets_like)
        {
            echo "Prepare grouped_retweets_like failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_retweets_of_id = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count
                FROM tweets
                WHERE is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND retweet_of_status_id = ?
                GROUP BY binned_time
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_retweets_of_id)
        {
            echo "Prepare grouped_retweets_of_id failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_retweets_of_range = $this->db->prepare(
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
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_retweets_of_range)
        {
            echo "Prepare grouped_retweets_of_range failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_noise = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND retweet_count < ?
                GROUP BY binned_time
                ORDER BY binned_time"
        );
        if (!$this->queries->grouped_noise)
        {
            echo "Prepare grouped_noise failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_noise_like = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND retweet_count < ?
                AND text LIKE ?
                GROUP BY binned_time
                ORDER BY binned_time"
        );
        if (!$this->queries->grouped_noise_like)
        {
            echo "Prepare grouped_noise_like failed: (" . $this->db->errno . ") " . $this->db->error;
        }
    }

    /**
     * Execute a query. Expects a query name, MySQLi type string, and list of parameters to bind.
     * @param type $queryname
     * @param type $typestr
     * @return type
     */
    private function run($queryname, $typestr = NULL)
    {
        $query = $this->queries->{$queryname};

        $args = array_slice(func_get_args(), 1);
        call_user_func_array(array($query, 'bind_param'), refValues($args));

        $this->start($queryname);

        $query->execute();
        $result = $query->get_result();

        $this->stop($queryname);

        return $result;
    }

    /**
     * Gets tweets in the specified interval. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $noise_threshold The minimum retweet count to be returned
     *
     * @return mysqli_result
     */
    public function get_originals($start_datetime, $stop_datetime, $limit, $noise_threshold, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL)
        {
            $result = $this->run('originals', 'ssii', $start_datetime,
                    $stop_datetime, $noise_threshold, $limit);
        }
        else
        {
            $search = "%$text_search%";
            $result = $this->run('originals_like', 'ssisi', $start_datetime,
                    $stop_datetime, $noise_threshold, $search, $limit);
        }
        return $result;
    }

    /**
     * Counts tweets in the specified interval, grouped by time. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @param int $noise_threshold The minimum retweet count to be returned.
     * @return mysqli_result
     */
    public function get_grouped_originals($start_datetime, $stop_datetime, $group_seconds, $noise_threshold, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL)
        {
            $result = $this->run('grouped_originals', 'sisissi',
                    $start_datetime, $group_seconds, $start_datetime,
                    $group_seconds, $start_datetime, $stop_datetime,
                    $noise_threshold);
        }
        else
        {
            $search = "%$text_search%";
            $result = $this->run('grouped_originals_like', 'sisissis',
                    $start_datetime, $group_seconds, $start_datetime,
                    $group_seconds, $start_datetime, $stop_datetime,
                    $noise_threshold, $search);
        }



        return $result;
    }

    /**
     * Get retweet counts grouped over a time interval.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds
     * @return mysqli_result
     */
    public function get_grouped_retweets($start_datetime, $stop_datetime, $group_seconds, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL)
        {
            $result = $this->run('grouped_retweets', 'sisiss', $start_datetime,
                    $group_seconds, $start_datetime, $group_seconds,
                    $start_datetime, $stop_datetime);
        }
        else
        {
            $search = "%$text_search%";
            $result = $this->run('grouped_retweets_like', 'sisisss',
                    $start_datetime, $group_seconds, $start_datetime,
                    $group_seconds, $start_datetime, $stop_datetime, $search);
        }

        return $result;
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

        $result = $this->run('grouped_retweets_of_id', 'sisisss',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime, $tweet_id);

        return $result;
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

        $result = $this->run('grouped_retweets_of_range', 'sisissss',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $tweets_start_datetime, $tweets_stop_datetime);

        return $result;
    }

    /**
     * Gets noise tweets in the specified interval. Returns a MySQLi result set object.
     *
     * @param DateTime $start_datetime
     * @param DateTime $stop_datetime
     * @param int $group_seconds The bin size in seconds
     * @param int $noise_threshold The maximum retweet count to return.
     * @return mysqli_result
     */
    public function get_grouped_noise($start_datetime, $stop_datetime, $group_seconds, $noise_threshold, $text_search = NULL)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        if ($text_search === NULL)
        {
            $result = $this->run('grouped_noise', 'sisissi', $start_datetime,
                    $group_seconds, $start_datetime, $group_seconds,
                    $start_datetime, $stop_datetime, $noise_threshold);
        }
        else
        {
            $search = "%$text_search%";
            $result = $this->run('grouped_noise_like', 'sisissis',
                    $start_datetime, $group_seconds, $start_datetime,
                    $group_seconds, $start_datetime, $stop_datetime,
                    $noise_threshold, $search);
        }

        return $result;
    }

}
