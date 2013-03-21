<?php

class CountBin {

    public function __construct($time)
    {
        $this->time = $time * 1000;
        $this->count = 0;
    }

}

class CountGroup {

    public function __construct($id)
    {
        $this->id = $id;
        $this->values = array();
    }

    public function add_bin($time)
    {
        $this->values[] = new CountBin($time);
    }

    public function get_bin($index)
    {
        return $this->values[$index];
    }

}

class GroupedSeries {

    public function __construct()
    {
        $this->groups = array();
    }

    /**
     * Get a group for this id.
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
