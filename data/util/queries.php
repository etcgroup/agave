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
                GROUP BY ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?)
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
                GROUP BY ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?)
                ORDER BY binned_time"
        );

        if (!$this->queries->grouped_retweets)
        {
            echo "Prepare grouped_retweets failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->queries->grouped_noise = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                AND retweet_count < ?
                GROUP BY ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?)
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
     *
     * @return mysqli_result
     */
    public function get_originals($start_datetime, $stop_datetime)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->queries->originals->bind_param('ss', $start_datetime,
                $stop_datetime);

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

        $this->queries->grouped_originals->bind_param('sisissiisi',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime, $noise_threshold, $group_seconds,
                $start_datetime, $group_seconds);

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

        $this->queries->grouped_retweets->bind_param('sisissisi',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime, $group_seconds,
                $start_datetime, $group_seconds);

        $this->start('grouped_retweets');
        $this->queries->grouped_retweets->execute();

        $result = $this->queries->grouped_retweets->get_result();
        $this->stop('grouped_retweets');

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

        $this->queries->grouped_noise->bind_param('sisissiisi',
                $start_datetime, $group_seconds, $start_datetime,
                $group_seconds, $start_datetime, $stop_datetime, $noise_threshold, $group_seconds,
                $start_datetime, $group_seconds);

        $this->start('grouped_noise');
        $this->queries->grouped_noise->execute();

        $result = $this->queries->grouped_noise->get_result();
        $this->stop('grouped_noise');

        return $result;
    }
}
