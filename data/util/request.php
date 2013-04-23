<?php

include_once 'performance.php';
include_once 'queries.php';

/**
 * The Request class collects together several disparate pieces of information that
 * are relevant to each request:
 *      - request parameters
 *      - database connection
 *      - performance stats
 *
 * The bulk of the class is a utility for processesing $_GET parameters, the get()
 * method, which is used to retreive specific $_GET variables as an object.
 *
 * It also defines some convenience methods for handling common parameters,
 * such as times, which need to be converted from ms to DateTime objects.
 */
class Request {

    private $performance = NULL;
    private $db = NULL;

    /**
     * Get a performance timer for this request.
     * @return Performance
     */
    public function timing()
    {
        $this->performance = new Performance();

        if ($this->db) {
            //If the db is already initialized, share the performance tracker with it
            $this->db->record_timing($this->performance);
        }

        return $this->performance;
    }

    /**
     * Initialize and get the database connection for this request.
     * @param type $params
     */
    public function db($params=NULL)
    {
        $this->db = new Queries($params);

        if ($this->performance) {
            //If the performance tracker is already initialized, share it with the db
            $this->db->record_timing($this->performance);
        }

        return $this->db;
    }

    /**
     * JSON encode and print the response.
     *
     * The response will be an object containing the payload,
     * as well as request and performance data for debugging.
     *
     * @param mixed $payload
     */
    public function response($payload)
    {
        $response = array(
            'payload' => $payload
        );

        $response['request'] = $_GET;

        if ($this->performance !== NULL)
        {
            $response['performance'] = $this->performance;
        }

        header('Content-type: application/json');
        echo json_encode($response);
    }

    /**
     * Collects GET request parameters.
     *
     * The first argument is an array of required parameters names.
     * If a required parameter is missing, an Exception will be thrown.
     *
     * The second argument (optional) is an array of optional parameters to
     * look for. Any of these that are missing will default to NULL in the result.
     *
     * @param array $required The required parameters
     * @param array $optional The optional parameters (optional)
     * @return type
     */
    public function get($required, $optional = array())
    {
        $request = array();
        foreach ($required as $param_name)
        {
            if (array_key_exists($param_name, $_GET))
            {
                $request[$param_name] = $_GET[$param_name];
            }
            else
            {
                throw new Exception("Parameter $param_name is required");
            }
        }

        foreach ($optional as $param_name)
        {
            if (array_key_exists($param_name, $_GET))
            {
                $request[$param_name] = $_GET[$param_name];
            }
            else
            {
                $request[$param_name] = NULL;
            }
        }

        return (object) $request;
    }

    /**
     * Get 'from' and 'to' DateTimes.
     *
     * @return type
     */
    public function timeParameters()
    {
        $params = $this->get(array('from', 'to'));

        $from = (int) ($params->from / 1000);
        $to = (int) ($params->to / 1000);

        return (object) array(
                    'from' => new DateTime("@$from"),
                    'to' => new DateTime("@$to"),
        );
    }

    /**
     * Get 'from' and 'to' DateTimes, as well as
     * a grouping 'interval'.
     *
     * @return type
     */
    public function binnedTimeParams()
    {
        $bundle = $this->timeParameters();

        $params = $this->get(array('interval'));
        $interval = (int) ($params->interval / 1000);

        if ($interval == 0)
            $interval = 1;

        $bundle->interval = (int) $interval;

        return $bundle;
    }

}
