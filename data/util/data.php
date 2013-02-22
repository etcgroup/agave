<?php

class TimeBin {

    public function __construct($time)
    {
        $this->time = $time;
        $this->count = 0;
        $this->groups = array();
    }

}

class SentimentGroup {

    public function __construct($sentiment)
    {
        $this->sentiment = $sentiment;
        $this->count = 0;
    }

}
