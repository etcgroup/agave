<?php

class Performance {

    public $times = array();
    private $start_times = array();

    public function start($name)
    {
        $this->start_times[$name] = microtime(TRUE);
    }

    public function stop($name)
    {
        $this->times[$name] = microtime(TRUE) - $this->start_times[$name];
    }

}
