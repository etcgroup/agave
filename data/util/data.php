<?php

class TimeBin {

    public function __construct($time)
    {
        $this->time = $time * 1000;
        $this->count = 0;
        $this->groups = array();
    }

    /**
     * Get a group for this sentiment.
     *
     * @param type $sentiment
     */
    public function sentiment_group($sentiment)
    {
        foreach ($this->groups as $group)
        {
            if ($group->sentiment == $sentiment)
            {
                return $group;
            }
        }

        //Create if doesn't exist.
        $group = new SentimentGroup($sentiment);
        $this->groups[] = $group;
        return $group;
    }

}

class SentimentGroup {

    public function __construct($sentiment)
    {
        $this->sentiment = $sentiment;
        $this->count = 0;
    }

}

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
