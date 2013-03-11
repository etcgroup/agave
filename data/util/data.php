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
    public function sentiment_group($sentiment) {
        foreach ($this->groups as $group) {
            if ($group->sentiment == $sentiment) {
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
