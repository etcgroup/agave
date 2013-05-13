<?php

/**
 * A timer class for measuring performance of multiple
 * events during execution.
 *
 * Each event to be measured has a unique name, which is provided
 * to the start and stop methods to record times.
 *
 * Performance can also measure counts of events, via the counter method.
 */
class Performance
{

    public $counts = array();
    public $times = array();
    public $queries = array();
    private $start_times = array();

    /**
     * Mark the start of an event specified by name.
     *
     * If an event of the same name was already recorded,
     * it will be overwritten.
     *
     * @param string $name
     */
    public function start($name)
    {
        $this->start_times[$name] = microtime(TRUE);
    }

    /**
     * Record a sql string and bound values for a query.
     *
     * @param $name
     * @param $sql
     * @param $valueMap
     */
    public function sql($name, $sql, $valueMap)
    {
        $this->queries[$name] = array($sql, $valueMap);
    }

    /**
     * Mark the stop of an event by name.
     *
     * @param string $name
     */
    public function stop($name)
    {
        if (!array_key_exists($name, $this->times)) {
            $this->times[$name] = 0;
        }

        $this->times[$name] += microtime(TRUE) - $this->start_times[$name];
    }

    /**
     * Increment a counter with the given name.
     * @param string $name
     */
    public function counter($name)
    {
        if (!array_key_exists($name, $this->counts)) {
            $this->counts[$name] = 0;
        }

        $this->counts[$name] += 1;
    }

}
