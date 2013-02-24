<?php

class Performance {

    public $counts = array();
    public $times = array();
    private $start_times = array();

    public function start($name)
    {
        $this->start_times[$name] = microtime(TRUE);
    }

    public function stop($name)
    {
        if (!array_key_exists($name, $this->times)) {
            $this->times[$name] = 0;
        }

        $this->times[$name] += microtime(TRUE) - $this->start_times[$name];
    }

    public function counter($name) {
        if (!array_key_exists($name, $this->counts)) {
            $this->counts[$name] = 0;
        }

        $this->counts[$name] += 1;
    }

}
