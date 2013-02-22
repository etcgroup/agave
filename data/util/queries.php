<?php

class Queries {

    private $db;
    private $originals_in_interval;
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
        $this->originals_in_interval = $this->db->prepare(
                "SELECT *
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                ORDER BY created_at"
        );
        if (!$this->originals_in_interval)
        {
            echo "Prepare originals_in_interval failed: (" . $this->db->errno . ") " . $this->db->error;
        }

        $this->grouped_originals_in_interval = $this->db->prepare(
                "SELECT UNIX_TIMESTAMP(?) + ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?) AS binned_time,
                    COUNT(*) as count,
                    SUM(IF(sentiment=1,1,0)) AS positive,
                    SUM(IF(sentiment=0,1,0)) AS neutral,
                    SUM(IF(sentiment=-1,1,0)) AS negative
                FROM tweets
                WHERE NOT is_retweet
                AND created_at >= ?
                AND created_at < ?
                GROUP BY ? * FLOOR((UNIX_TIMESTAMP(created_at)-UNIX_TIMESTAMP(?)) / ?)
                ORDER BY binned_time"
        );

        if (!$this->grouped_originals_in_interval)
        {
            echo "Prepare grouped_originals_in_interval failed: (" . $this->db->errno . ") " . $this->db->error;
        }
    }

    /**
     * Gets tweets in the specified interval. Returns a MySQLi result set object.
     *
     * @param type $start_timestamp
     * @param type $stop_timestamp
     * @return type
     */
    public function get_originals_in_interval($start_datetime, $stop_datetime)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->originals_in_interval->bind_param('ss', $start_datetime,
                $stop_datetime);

        $this->start('originals_in_interval');
        $this->originals_in_interval->execute();

        $result = $this->originals_in_interval->get_result();
        $this->stop('originals_in_interval');
        return $result;
    }

    /**
     * Counts tweets in the specified interval, grouped by time. Returns a MySQLi result set object.
     *
     * @param type $start_timestamp
     * @param type $stop_timestamp
     * @param type $group_seconds
     * @return type
     */
    public function get_grouped_originals_in_interval($start_datetime, $stop_datetime, $group_seconds)
    {
        $start_datetime = $start_datetime->format('Y-m-d H:i:s');
        $stop_datetime = $stop_datetime->format('Y-m-d H:i:s');

        $this->grouped_originals_in_interval->bind_param('sisissisi',
                $start_datetime, $group_seconds, $start_datetime, $group_seconds, $start_datetime, $stop_datetime,
                $group_seconds, $start_datetime, $group_seconds);

        $this->start('grouped_originals_in_interval');
        $this->grouped_originals_in_interval->execute();

        $result = $this->grouped_originals_in_interval->get_result();
        $this->stop('grouped_originals_in_interval');

        return $result;
    }

}
