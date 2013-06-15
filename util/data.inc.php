<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

/**
 * This file defines several classes for transitioning data to/from
 * the database to/from the client.
 */

/**
 * CountBin represents a count of something at a time.
 */
class CountBin {

    var $time;
    var $count;

    public function __construct($time)
    {
        $this->time = $time * 1000;
        $this->count = 0;
    }

}

/**
 * CountGroup represents a collection of CountBins with a specific id value.
 */
class CountGroup {

    var $id;
    var $values;
    private $time_value_map;

    public function __construct($id)
    {
        $this->id = $id;
        $this->values = array();
        $this->time_value_map = array();
    }

    /**
     * Make a new bin at the given time.
     * @param type $time
     */
    public function add_bin($time)
    {
        $bin = new CountBin($time);
        $this->values[] = $bin;
        $this->time_value_map[$time] = $bin;
    }

    /**
     * Get a bin by index.
     *
     * @param type $index
     * @return type
     */
    public function get_bin($index)
    {
        return $this->values[$index];
    }

    /**
     * Get the bin for the given time.
     *
     * @param type $time
     * @return type
     */
    public function get_bin_at($time)
    {
        return $this->time_value_map[$time];
    }

}

/**
 * GroupedSeries is a collection of CountGroups.
 */
class GroupedSeries {

    var $groups;

    /**
     * Initialize an empty GroupedSeries. It has no groups.
     */
    public function __construct()
    {
        $this->groups = array();
    }

    /**
     * Get the CountGroup for this id.
     *
     * If there is no CountGroup yet for this id, one is created.
     *
     * @param type $id
     */
    public function get_group($id)
    {
        if (array_key_exists($id, $this->groups))
        {
            return $this->groups[$id];
        }

        $group = new CountGroup($id);
        $this->groups[$id] = $group;
        return $group;
    }

    /**
     * Get the groups as a flat array.
     * @return type
     */
    public function groups_array()
    {
        return array_values($this->groups);
    }

}
