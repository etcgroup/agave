<?php

class Queries {

    private $db;
    private $queries;
    private $originals;
    private $performance = NULL;

    public function __construct($host, $user, $password, $schema)
    {
        $this->db = new mysqli($host, $user, $password, $schema);
        $this->build_queries();
        $this->set_timezone();
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
                ORDER BY created_at"
        );
        if (!$this->queries->originals)
        {
            echo "Prepare originals failed: (" . $this->db->errno . ") " . $this->db->error;
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
    public function get_originals($start_datetime, $stop_datetime, $noise_threshold)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->queries->originals->bind_param('ssi', $start_datetime,
                $stop_datetime, $noise_threshold);

        $this->start('originals');
        $this->queries->originals->execute();

        $result = $this->queries->originals->get_result();
        $this->stop('originals');
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
    public function get_grouped_originals($start_datetime, $stop_datetime, $group_seconds, $noise_threshold)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->queries->grouped_originals->bind_param('sisissi',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $noise_threshold);

        $this->start('grouped_originals');
        $this->queries->grouped_originals->execute();

        $result = $this->queries->grouped_originals->get_result();
        $this->stop('grouped_originals');

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
    public function get_grouped_retweets($start_datetime, $stop_datetime, $group_seconds)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->queries->grouped_retweets->bind_param('sisiss', $start_datetime,
                $group_seconds, $start_datetime, $group_seconds,
                $start_datetime, $stop_datetime);

        $this->start('grouped_retweets');
        $this->queries->grouped_retweets->execute();

        $result = $this->queries->grouped_retweets->get_result();
        $this->stop('grouped_retweets');

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

        $this->queries->grouped_retweets_of_id->bind_param('sisisss',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime, $tweet_id);

        $this->start('grouped_retweets_of_id');
        $this->queries->grouped_retweets_of_id->execute();

        $result = $this->queries->grouped_retweets_of_id->get_result();
        $this->stop('grouped_retweets_of_id');

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

        $this->queries->grouped_retweets_of_range->bind_param('sisissss',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime,
                $tweets_start_datetime, $tweets_stop_datetime);

        $this->start('grouped_retweets_of_range');
        $this->queries->grouped_retweets_of_range->execute();

        $result = $this->queries->grouped_retweets_of_range->get_result();
        $this->stop('grouped_retweets_of_range');

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
    public function get_grouped_noise($start_datetime, $stop_datetime, $group_seconds, $noise_threshold)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->queries->grouped_noise->bind_param('sisissi', $start_datetime,
                $group_seconds, $start_datetime, $group_seconds,
                $start_datetime, $stop_datetime, $noise_threshold);

        $this->start('grouped_noise');
        $this->queries->grouped_noise->execute();

        $result = $this->queries->grouped_noise->get_result();
        $this->stop('grouped_noise');

        return $result;
    }

}
